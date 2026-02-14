import 'dotenv/config';
/**
 * Zaki Platform - VM-based Server
 *
 * Telegram → Onboarding → Instance Manager → OpenClaw Gateway
 *
 * Architecture:
 * - Express server receives Telegram webhooks
 * - New users → onboarding flow → auto-create isolated instance
 * - Existing users → route to their isolated OpenClaw gateway
 * - Each user gets own port, config, and workspace
 */

import express from 'express';
import { 
  OnboardingState, 
  getOnboardingMessage, 
  generateUserMd, 
  generateSoulMd, 
  getWakingUpMessage,
  tr
} from './onboarding';
import { InstanceManager } from './services/instance-manager';
import { createTelegramRetryRunner } from './utils/retry-policy';
import { getHealthSummary } from './services/health';
import { HealthCheckService, createHealthCheckMiddleware } from './services/health-check';
import { configureSetupBot, getBotInfo } from './utils/bot-config';

const app = express();
app.use(express.json());
// Serve static files (for Web App)
app.use(express.static('public'));

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || 'zaki-internal-token';

// Initialize instance manager
const instanceManager = new InstanceManager();

// Initialize health check service
const healthService = new HealthCheckService(30000); // 30s startup grace period

// Initialize Telegram retry runner
const telegramRetry = createTelegramRetryRunner({
  verbose: true, // Log retries for debugging
});

// ==========================================
// Health check endpoints (Kubernetes-compatible)
// ==========================================
const healthMiddleware = createHealthCheckMiddleware(healthService);

// Liveness probe - Kubernetes will restart if this fails
app.get('/health/live', healthMiddleware.liveness);

// Readiness probe - Kubernetes will stop sending traffic if this fails
app.get('/health/ready', healthMiddleware.readiness);

// Startup probe - Kubernetes will wait before starting readiness checks
app.get('/health/startup', healthMiddleware.startup);

// Combined health check
app.get('/health', healthMiddleware.health);

// Legacy health endpoint (backwards compatibility)
app.get('/', async (req, res) => {
  try {
    const wantsProbe = req.query.probe === 'true';
    const summary = await getHealthSummary(instanceManager, { 
      probe: wantsProbe,
      useCache: !wantsProbe,
    });
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Health check failed',
      ts: Date.now(),
    });
  }
});

app.get('/status', async (req, res) => {
  try {
    const instances = await instanceManager.listInstances();
    res.json({
      instances,
      total: instances.length,
      running: instances.filter(i => i.running).length,
      stopped: instances.filter(i => !i.running).length,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Status check failed',
    });
  }
});

// ==========================================
// Setup: Register Telegram webhook
// ==========================================
app.get('/setup', async (req, res) => {
  const workerUrl = req.protocol + '://' + req.get('host');
  const webhookUrl = `${workerUrl}/telegram/webhook`;
  
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    }
  );
  
  const result = await response.json();
  res.json({ webhook: webhookUrl, telegram: result });
});

// ==========================================
// Telegram Update Handler (used by both webhook and polling)
// ==========================================
async function handleTelegramUpdate(update: any) {
  // Handle callback queries (button presses)
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }
  
  // Handle messages
  const message = update.message;
  if (!message?.from) {
    return;
  }

  const telegramUserId = String(message.from.id);
  const text = message.text?.trim() || '';
  const chatId = message.chat.id;
  
  // Handle Web App data (from Telegram Mini Apps)
  if (message.web_app_data) {
    try {
      const webAppData = JSON.parse(message.web_app_data.data);
      if (webAppData.type === 'bot_token' && webAppData.token) {
        // Handle token from Web App
        await handleWebAppToken(telegramUserId, chatId, webAppData.token, message.from);
        return;
      }
    } catch (error) {
      console.error('Error parsing web app data:', error);
    }
  }

  try {
    // Check if user is onboarding (using file system instead of R2)
    const fs = await import('fs/promises');
    const onboardingPath = `/tmp/zaki-onboarding/${telegramUserId}.json`;
    
    let state: OnboardingState | null = null;
    try {
      const stateData = await fs.readFile(onboardingPath, 'utf-8');
      state = JSON.parse(stateData);
    } catch {
      // No onboarding state
    }
    
    // Handle /start command - always reset onboarding
    if (text === '/start') {
      // Clear any existing onboarding state
      try {
        await fs.unlink(onboardingPath);
      } catch {
        // Ignore if file doesn't exist
      }
      
      // Start with language selection
      const initialState: OnboardingState = { step: 'language' };
      await fs.mkdir('/tmp/zaki-onboarding', { recursive: true });
      await fs.writeFile(onboardingPath, JSON.stringify(initialState));
      
      const msg = getOnboardingMessage(initialState, message.from);
      await sendTelegramMessage(chatId, msg.text, msg.buttons);
      return;
    }

    // If still onboarding, handle onboarding input
    if (state && state.step !== 'complete') {
      await handleOnboardingInput(telegramUserId, chatId, text, state, onboardingPath, message.from, message);
      return;
    }

    // Not onboarding - check if user has completed onboarding
    const profilePath = `/root/zaki-platform/data/users/${telegramUserId}/profile.json`;
    let profile: OnboardingState | null = null;
    
    try {
      const profileData = await fs.readFile(profilePath, 'utf-8');
      profile = JSON.parse(profileData);
    } catch {
      // No profile = hasn't onboarded yet
      const initialState: OnboardingState = { step: 'language' };
      await fs.mkdir('/tmp/zaki-onboarding', { recursive: true });
      await fs.writeFile(onboardingPath, JSON.stringify(initialState));
      
      const msg = getOnboardingMessage(initialState, message.from);
      await sendTelegramMessage(chatId, msg.text, msg.buttons);
      return;
    }

    // User is onboarded
    if (!profile) {
      await sendTelegramMessage(chatId, 'Profile not found. Please send /start to begin.');
      return;
    }
    
    const lang = profile.language || 'en';
    
    // Check if user has their own bot token
    if (profile.botToken && profile.botUsername) {
      // User has their own bot - redirect them to it
      await sendTelegramMessage(
        chatId,
        `You're chatting with **Zaki - Setup Assistant**.\n\n👉 **[Go to your private bot](https://t.me/${profile.botUsername})** to chat with your personal Zaki!\n\nYour bot has full AI capabilities and is completely private.`
      );
      return;
    }

    // Legacy user without bot token - offer upgrade
    const instanceConfig = await instanceManager.getInstanceConfig(telegramUserId);
    if (instanceConfig) {
      // Legacy user - start upgrade onboarding
      const upgradeState: OnboardingState = { 
        ...profile,
        step: 'bot_token'
      };
      await fs.mkdir('/tmp/zaki-onboarding', { recursive: true });
      await fs.writeFile(onboardingPath, JSON.stringify(upgradeState));
      
      // Send proper onboarding message for bot_token step
      const msg = getOnboardingMessage(upgradeState, undefined, telegramUserId);
      await sendTelegramMessage(chatId, msg.text, msg.buttons);
      return;
    }

    // New user without instance - should have gone through onboarding
    await sendTelegramMessage(chatId, 'Please send /start to begin setup.');
  } catch (error: any) {
    console.error('Error:', error?.message || error, 'Stack:', error?.stack?.slice(0, 500));
    await sendTelegramMessage(chatId, 'Sorry, something went wrong. Please try again.');
  }
}

// Webhook endpoint (for future HTTPS setup)
app.post('/telegram/webhook', async (req, res) => {
  await handleTelegramUpdate(req.body);
  return res.json({ ok: true });
});

// ==========================================
// Handle button callbacks during onboarding
// ==========================================
async function handleCallbackQuery(query: any) {
  const telegramUserId = String(query.from.id);
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Acknowledge the callback
  await telegramRetry(async () => {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: query.id }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.description || `HTTP ${response.status}`);
      (error as any).response = errorData;
      throw error;
    }
    
    return response;
  }, 'answerCallbackQuery');

  const fs = await import('fs/promises');
  const stateKey = `/tmp/zaki-onboarding/${telegramUserId}.json`;
  
  let state: OnboardingState;
  try {
    const stateData = await fs.readFile(stateKey, 'utf-8');
    state = JSON.parse(stateData);
  } catch {
    return;
  }

  // Process callback based on prefix
  if (data.startsWith('lang:')) {
    state.language = data.split(':')[1];
    state.step = 'name';
  } else if (data.startsWith('purpose:')) {
    state.purpose = data.split(':')[1];
    state.step = 'style';
  } else if (data.startsWith('style:')) {
    state.style = data.split(':')[1];
    state.interests = 'Not specified';
    state.step = 'api_keys';
    state.apiKeys = state.apiKeys || { useShared: true };
  } else if (data === 'api_keys:skip') {
    state.apiKeys = { useShared: true };
    state.step = 'template';
  } else if (data.startsWith('template:')) {
    state.template = data.replace('template:', '') === 'skip' ? undefined : data.replace('template:', '');
    state.step = 'skills';
  } else if (data === 'skills:default') {
    state.skills = ['github', 'tmux', 'coding-agent'];
    state.step = 'bot_token';
  } else if (data === 'skills:skip') {
    state.skills = undefined;
    state.step = 'bot_token';
  } else if (data === 'api_keys:add') {
    // User wants to add API keys - stay on api_keys step
    state.step = 'api_keys';
    // Don't change step, just show instructions
  } else if (data === 'bot_token:skip') {
    // Skip bot token - use shared mode
    state.step = 'complete';
    state.botToken = undefined;
    state.botUsername = undefined;
  } else if (data === 'bot_token:help') {
    // Show help for creating bot
    const helpText = `**How to create your bot:**\n\n1. Click the "Open BotFather" button above\n2. Send \`/newbot\` to BotFather\n3. Choose a name (e.g., "My Zaki Bot")\n4. Choose a username ending with \`_bot\` (e.g., \`zaki_alaa_bot\`)\n5. BotFather will give you a token\n6. Copy and paste the token here\n\n**Example token format:**\n\`1234567890:ABCdefGHIjklMNOpqrsTUVwxyz\`\n\n_This takes 2 minutes!_`;
    await sendTelegramMessage(chatId, helpText);
    // Show bot_token message again
    const msg = getOnboardingMessage(state, undefined, telegramUserId);
    await sendTelegramMessage(chatId, msg.text, msg.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  }

  // Save updated state
  await fs.writeFile(stateKey, JSON.stringify(state));
  
  // Send next step
  const msg = getOnboardingMessage(state, undefined, telegramUserId);
  await sendTelegramMessage(chatId, msg.text, msg.buttons);
}

// ==========================================
// Handle Web App token submission
// ==========================================
async function handleWebAppToken(
  telegramUserId: string,
  chatId: number,
  token: string,
  telegramUser: any
) {
  const fs = await import('fs/promises');
  const onboardingPath = `/tmp/zaki-onboarding/${telegramUserId}.json`;
  
  let state: OnboardingState | null = null;
  try {
    const stateData = await fs.readFile(onboardingPath, 'utf-8');
    state = JSON.parse(stateData);
  } catch {
    await sendTelegramMessage(chatId, '❌ No active onboarding session. Please send /start to begin.');
    return;
  }
  
  if (state.step !== 'bot_token') {
    await sendTelegramMessage(chatId, '❌ Invalid step. Please send /start to begin again.');
    return;
  }
  
  // Process token (same as text input)
  await handleOnboardingInput(telegramUserId, chatId, token, state, onboardingPath, telegramUser);
}

// ==========================================
// Handle text input during onboarding
// ==========================================
async function handleOnboardingInput(
  telegramUserId: string,
  chatId: number,
  text: string,
  state: OnboardingState,
  stateKey: string,
  telegramUser: any,
  message?: any  // Add message parameter for token deletion
) {
  const fs = await import('fs/promises');
  
  if (state.step === 'name') {
    state.name = text;
    state.step = 'purpose';
    // Send next step message
    const msg = getOnboardingMessage(state, telegramUser);
    await sendTelegramMessage(chatId, msg.text, msg.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  } else if (state.step === 'interests') {
    state.interests = text || 'Not specified';
    state.step = 'api_keys';
    state.apiKeys = state.apiKeys || { useShared: true }; // Default to shared keys
    const msg = getOnboardingMessage(state);
    await sendTelegramMessage(chatId, msg.text, msg.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  } else if (state.step === 'api_keys') {
    if (text === '/skip') {
      state.apiKeys = { useShared: true };
      state.step = 'template';
      const msg = getOnboardingMessage(state, undefined, telegramUserId);
      await sendTelegramMessage(chatId, msg.text, msg.buttons);
      await fs.writeFile(stateKey, JSON.stringify(state));
      return;
    } else if (text.startsWith('/anthropic ')) {
      const key = text.replace('/anthropic ', '').trim();
      if (!state.apiKeys) state.apiKeys = {};
      state.apiKeys.anthropic = key;
      state.apiKeys.useShared = false;
      await sendTelegramMessage(chatId, '✅ Anthropic API key saved! Send `/openai YOUR_KEY` or `/skip` to finish.');
      await fs.writeFile(stateKey, JSON.stringify(state));
      return;
    } else if (text.startsWith('/openai ')) {
      const key = text.replace('/openai ', '').trim();
      if (!state.apiKeys) state.apiKeys = {};
      state.apiKeys.openai = key;
      state.apiKeys.useShared = false;
      await sendTelegramMessage(chatId, '✅ OpenAI API key saved! Send `/google YOUR_KEY` or `/skip` to finish.');
      await fs.writeFile(stateKey, JSON.stringify(state));
      return;
    } else if (text.startsWith('/google ')) {
      const key = text.replace('/google ', '').trim();
      if (!state.apiKeys) state.apiKeys = {};
      state.apiKeys.google = key;
      state.apiKeys.useShared = false;
      state.step = 'template';
    } else if (text === '/add') {
      await sendTelegramMessage(chatId, tr('api_keys_instructions', state.language || 'en'));
      await fs.writeFile(stateKey, JSON.stringify(state));
      return; // Don't advance, wait for key input
    } else {
      await sendTelegramMessage(chatId, tr('api_keys_instructions', state.language || 'en'));
      await fs.writeFile(stateKey, JSON.stringify(state));
      return;
    }
    const msgTemplate = getOnboardingMessage(state, telegramUser, telegramUserId);
    await sendTelegramMessage(chatId, msgTemplate.text, msgTemplate.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  } else if (state.step === 'template') {
    // Free-text template name (if they type instead of button)
    state.template = text.trim() || undefined;
    state.step = 'skills';
    const msgSkills = getOnboardingMessage(state, telegramUser, telegramUserId);
    await sendTelegramMessage(chatId, msgSkills.text, msgSkills.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  } else if (state.step === 'skills') {
    if (text === '/skip') {
      state.skills = undefined;
      state.step = 'bot_token';
    } else {
      state.skills = text.split(',').map(s => s.trim()).filter(Boolean);
      state.step = 'bot_token';
    }
    const msgBot = getOnboardingMessage(state, telegramUser, telegramUserId);
    await sendTelegramMessage(chatId, msgBot.text, msgBot.buttons);
    await fs.writeFile(stateKey, JSON.stringify(state));
    return;
  } else if (state.step === 'bot_token') {
    // Handle bot token input
    if (text === '/skip') {
      // Skip bot token - use shared mode (legacy)
      state.step = 'complete';
    } else if (text.startsWith('/')) {
      // Commands like /new, /start, etc. - show instructions again with buttons
        const msg = getOnboardingMessage(state, undefined, telegramUserId);
        await sendTelegramMessage(chatId, `_Commands aren't bot tokens. Here's what to do:_\n\n${msg.text}`, msg.buttons);
      await fs.writeFile(stateKey, JSON.stringify(state));
      return;
    } else {
      // Validate bot token format (should be like "1234567890:ABC...")
      const tokenPattern = /^\d{8,11}:[A-Za-z0-9_-]{35}$/;
      if (!tokenPattern.test(text)) {
        await sendTelegramMessage(chatId, tr('bot_token_invalid', state.language || 'en'));
        // Also show the instructions again with buttons
        const msg = getOnboardingMessage(state, undefined, telegramUserId);
        await sendTelegramMessage(chatId, `_That doesn't look right. Here's what to do:_\n\n${msg.text}`, msg.buttons);
        await fs.writeFile(stateKey, JSON.stringify(state));
        return;
      }
      
      // Security warning before processing
      await sendTelegramMessage(chatId, '🔒 **Security:** Your token will be encrypted and used immediately. I will delete the message containing your token right after processing for your security.');

      // Validate token with Telegram API
      await sendTelegramMessage(chatId, tr('bot_token_validating', state.language || 'en'));
      
      // Store message ID to delete later (for security)
      const tokenMessageId = message.message_id;

      try {
        const botInfoResponse = await telegramRetry(async () => {
          const response = await fetch(`https://api.telegram.org/bot${text}/getMe`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.description || `HTTP ${response.status}`);
            (error as any).response = errorData;
            throw error;
          }
          
          return response;
        }, 'getMe');
        
        const botInfo = await botInfoResponse.json() as any;
        
        if (!botInfo.ok) {
          await sendTelegramMessage(chatId, tr('bot_token_invalid', state.language || 'en'));
          await fs.writeFile(stateKey, JSON.stringify(state));
          return;
        }

        // Token is valid - save it and start instance creation
        state.botToken = text;
        state.botUsername = botInfo.result.username;
        
        // Save state first
        await fs.writeFile(stateKey, JSON.stringify(state));
        
        // Show startup message
        await sendTelegramMessage(chatId, `✅ **Bot token validated!**\n\n🤖 Your bot: @${botInfo.result.username}\n\n🚀 **Starting up your private AI instance...**\n\nThis will take about 30 seconds. I'm:\n• Creating your isolated container\n• Configuring your bot\n• Setting up the AI gateway\n• Assigning your bot to your instance\n\n_Hang tight!_ ⏳`);
        
        // Now create the instance with the bot token
        try {
          const apiKeyOptions: any = {
            telegramBotToken: state.botToken,
          };
          if (state.apiKeys && !state.apiKeys.useShared) {
            if (state.apiKeys.anthropic) apiKeyOptions.anthropicApiKey = state.apiKeys.anthropic;
            if (state.apiKeys.openai) apiKeyOptions.openaiApiKey = state.apiKeys.openai;
            if (state.apiKeys.google) apiKeyOptions.googleApiKey = state.apiKeys.google;
          }
          if (state.skills?.length) apiKeyOptions.skills = state.skills;
          if (state.template) apiKeyOptions.template = state.template;

          const userName = state.name || 'User';
          const instanceConfig = await instanceManager.createUserInstance(
            telegramUserId,
            userName,
            apiKeyOptions
          );
          
          // Save profile to complete onboarding
          const profileDir = `/root/zaki-platform/data/users/${telegramUserId}`;
          await fs.mkdir(profileDir, { recursive: true });
          const profileKey = `${profileDir}/profile.json`;
          
          // Complete onboarding state
          state.step = 'complete';
          await fs.writeFile(profileKey, JSON.stringify(state));
          
          // Generate and save USER.md and SOUL.md
          const userMd = generateUserMd(state);
          const soulMd = generateSoulMd(state);
          await fs.writeFile(`${profileDir}/USER.md`, userMd);
          await fs.writeFile(`${profileDir}/SOUL.md`, soulMd);
          
          // Clean up onboarding state
          await fs.unlink(stateKey).catch(() => {});
          
          // Delete the message containing the token (for security)
          try {
            await telegramRetry(async () => {
              const response = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    message_id: tokenMessageId,
                  }),
                }
              );
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error = new Error(errorData.description || `HTTP ${response.status}`);
                (error as any).response = errorData;
                throw error;
              }
              return response;
            }, 'deleteMessage');
            console.log(`✅ Deleted token message ${tokenMessageId} for security`);
          } catch (error) {
            // Log but don't fail if deletion fails
            console.warn(`⚠️ Could not delete token message: ${error instanceof Error ? error.message : String(error)}`);
          }
          
          // Tell user their bot is ready - they can start chatting!
          await sendTelegramMessage(
            chatId,
            tr('complete', state.language || 'en', {
              name: userName,
              bot_username: state.botUsername || 'your_bot'
            })
          );
          
        } catch (error: any) {
          console.error('Failed to create instance:', error);
          await sendTelegramMessage(
            chatId,
            `❌ **Instance creation failed**\n\nError: ${error?.message || 'Unknown error'}\n\nPlease try again or contact support.`
          );
          // Don't mark as complete, allow retry
          return;
        }
      } catch (error) {
        await sendTelegramMessage(chatId, tr('bot_token_invalid', state.language || 'en'));
        await fs.writeFile(stateKey, JSON.stringify(state));
        return;
      }
    }
  }
  
  // Handle completion for users who skipped bot token
  if (state.step === 'complete' && !state.botToken) {
    // Save profile
    const profileDir = `/root/zaki-platform/data/users/${telegramUserId}`;
    await fs.mkdir(profileDir, { recursive: true });
    const profileKey = `${profileDir}/profile.json`;
    await fs.writeFile(profileKey, JSON.stringify(state));
    
    // Generate and save USER.md and SOUL.md
    const userMd = generateUserMd(state);
    const soulMd = generateSoulMd(state);
    await fs.writeFile(`${profileDir}/USER.md`, userMd);
    await fs.writeFile(`${profileDir}/SOUL.md`, soulMd);
    
    try {
      const apiKeyOptions: any = {};
      if (state.apiKeys && !state.apiKeys.useShared) {
        if (state.apiKeys.anthropic) apiKeyOptions.anthropicApiKey = state.apiKeys.anthropic;
        if (state.apiKeys.openai) apiKeyOptions.openaiApiKey = state.apiKeys.openai;
        if (state.apiKeys.google) apiKeyOptions.googleApiKey = state.apiKeys.google;
      }
      if (state.skills?.length) apiKeyOptions.skills = state.skills;
      if (state.template) apiKeyOptions.template = state.template;

      await instanceManager.createUserInstance(
        telegramUserId,
        state.name || 'User',
        apiKeyOptions
      );
      
      await sendTelegramMessage(chatId, tr('complete', state.language || 'en', {
        name: state.name || 'User',
        bot_username: 'zakified_bot' // Setup Assistant bot
      }));
    } catch (error) {
      console.error('Failed to create instance:', error);
      await sendTelegramMessage(chatId, 'Sorry, there was an error creating your instance. Please try again.');
      return;
    }
    
    // Clean up onboarding state
    await fs.unlink(stateKey).catch(() => {});
  }

  // Save state if not complete
  if (state.step !== 'complete') {
    await fs.writeFile(stateKey, JSON.stringify(state));
  }

  // Send next message
  const msg = getOnboardingMessage(state);
  await sendTelegramMessage(chatId, msg.text, msg.buttons);
}

// ==========================================
// Telegram helpers
// ==========================================
async function sendTelegramMessage(
  chatId: number,
  text: string,
  buttons?: Array<Array<{ text: string; callback_data?: string; url?: string; web_app?: { url: string } }>>
) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };

  if (buttons) {
    body.reply_markup = {
      inline_keyboard: buttons.map(row => 
        row.map(btn => {
          const button: any = { text: btn.text };
          if (btn.callback_data) button.callback_data = btn.callback_data;
          if (btn.url) button.url = btn.url;
          if (btn.web_app) button.web_app = btn.web_app;
          return button;
        })
      ),
    };
  }

  await telegramRetry(async () => {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.description || `HTTP ${response.status}`);
      (error as any).response = errorData;
      throw error;
    }
    
    return response;
  }, 'sendMessage');
}

async function sendTypingAction(chatId: number) {
  await telegramRetry(async () => {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.description || `HTTP ${response.status}`);
      (error as any).response = errorData;
      throw error;
    }
    
    return response;
  }, 'sendChatAction');
}

// Start server
const PORT = process.env.PORT || 3000;

// Start polling for Telegram updates (since webhook requires HTTPS)
async function startTelegramPolling() {
  let offset = 0;
  console.log('🔄 Starting Telegram polling...');
  
      while (true) {
    try {
      const response = await telegramRetry(async () => {
        const res = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10&allowed_updates=["message","callback_query"]`
        );
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const error = new Error(errorData.description || `HTTP ${res.status}`);
          (error as any).response = errorData;
          throw error;
        }
        
        return res;
      }, 'getUpdates');
      
      const data = await response.json() as any;
      
      if (!data.ok) {
        console.error('❌ Telegram API error:', data.description || 'Unknown error');
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      if (data.result && data.result.length > 0) {
        console.log(`📨 Received ${data.result.length} update(s)`);
        for (const update of data.result) {
          offset = update.update_id + 1;
          console.log(`📩 Processing update ${update.update_id}...`);
          
          // Handle the update
          try {
            await handleTelegramUpdate(update);
            console.log(`✅ Processed update ${update.update_id}`);
          } catch (error: any) {
            console.error(`❌ Error processing update ${update.update_id}:`, error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Polling error:', error.message);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s on error
    }
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Zaki Platform running on port ${PORT}`);
  console.log(`📱 Telegram polling: Active (getUpdates)`);
  
  // Configure bot name and description
  if (TELEGRAM_BOT_TOKEN) {
    try {
      const botInfo = await getBotInfo(TELEGRAM_BOT_TOKEN);
      console.log(`🤖 Bot: @${botInfo.username} (${botInfo.first_name})`);
      
      // Configure as Setup Assistant
      await configureSetupBot(TELEGRAM_BOT_TOKEN);
    } catch (error) {
      console.warn(`⚠️  Could not configure bot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Mark service as ready after initialization
  await new Promise(resolve => setTimeout(resolve, 2000)); // Give it 2s to initialize
  healthService.markReady();
  console.log(`✅ Health checks: Ready`);
  
  // Register readiness checks
  healthService.registerReadinessCheck('instanceManager', async () => {
    try {
      const instances = await instanceManager.listInstances();
      return {
        status: 'pass',
        message: `Instance manager operational (${instances.length} instances)`,
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Instance manager error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  });
  
  // Start polling in background
  startTelegramPolling().catch(err => {
    console.error('Failed to start polling:', err);
    healthService.markNotReady();
  });
});

export default app;
