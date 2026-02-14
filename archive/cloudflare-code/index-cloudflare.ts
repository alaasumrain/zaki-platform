/**
 * Zaki Platform - Worker
 * 
 * Telegram → Onboarding → Sandbox (OpenClaw)
 * 
 * Architecture:
 * - Worker receives Telegram webhooks
 * - New users → onboarding flow (stored in R2)
 * - Existing users → message forwarded to user's Sandbox
 * - Sandbox runs OpenClaw with /v1/chat/completions endpoint
 * - Response sent back to Telegram
 */

import { Hono } from 'hono';
import { getSandbox } from '@cloudflare/sandbox';
import { 
  OnboardingState, 
  getOnboardingMessage, 
  generateUserMd, 
  generateSoulMd, 
  getWakingUpMessage 
} from './onboarding';

export { Sandbox } from '@cloudflare/sandbox';

interface Env {
  Sandbox: DurableObjectNamespace;
  UserStorage: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  GOOGLE_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  DEFAULT_MODEL: string;
  NODE_ENV: string;
  GATEWAY_TOKEN: string;
}

const app = new Hono<{ Bindings: Env }>();
const OPENCLAW_PORT = 18789;
const GATEWAY_TOKEN = 'zaki-internal-token'; // Matches start-zaki.sh default

// ==========================================
// Health check
// ==========================================
app.get('/', (c) => {
  return c.json({ 
    name: 'Zaki Platform',
    status: 'running',
    version: '0.1.0',
  });
});

// ==========================================
// Setup: Register Telegram webhook
// ==========================================
app.get('/setup', async (c) => {
  const workerUrl = new URL(c.req.url).origin;
  const webhookUrl = `${workerUrl}/telegram/webhook`;
  
  const response = await fetch(
    `https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/setWebhook`,
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
  return c.json({ webhook: webhookUrl, telegram: result });
});

// ==========================================
// Telegram Webhook Handler
// ==========================================
app.post('/telegram/webhook', async (c) => {
  const update = await c.req.json();

  // Handle callback queries (button presses)
  if (update.callback_query) {
    return await handleCallbackQuery(c.env, update.callback_query);
  }
  
  // Handle messages
  const message = update.message;
  if (!message?.from) {
    return c.json({ ok: true });
  }

  const telegramUserId = String(message.from.id);
  const text = message.text?.trim() || '';
  const chatId = message.chat.id;

  try {
    // Check if user is onboarding
    const stateKey = `onboarding/${telegramUserId}.json`;
    const stateObj = await c.env.UserStorage.get(stateKey);
    
    // Handle /start command
    if (text === '/start') {
      const initialState: OnboardingState = { step: 'language' };
      await c.env.UserStorage.put(stateKey, JSON.stringify(initialState));
      
      const msg = getOnboardingMessage(initialState, message.from);
      await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, msg.text, msg.buttons);
      return c.json({ ok: true });
    }

    // If still onboarding, handle onboarding input
    if (stateObj) {
      const state: OnboardingState = await stateObj.json();
      
      if (state.step !== 'complete') {
        return await handleOnboardingInput(c.env, telegramUserId, chatId, text, state, stateKey, message.from);
      }
    }

    // Not onboarding - route to Sandbox
    // Check if user has completed onboarding
    const profileKey = `users/${telegramUserId}/profile.json`;
    const profile = await c.env.UserStorage.get(profileKey);
    
    if (!profile) {
      // No profile = hasn't onboarded yet
      const initialState: OnboardingState = { step: 'language' };
      await c.env.UserStorage.put(stateKey, JSON.stringify(initialState));
      
      const msg = getOnboardingMessage(initialState, message.from);
      await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, msg.text, msg.buttons);
      return c.json({ ok: true });
    }

    // User is onboarded → route to Sandbox
    const profileData = await profile.json() as OnboardingState;
    const lang = profileData.language || 'en';
    
    // Start typing indicator loop (keeps "typing..." visible the whole time)
    const typingInterval = startTypingLoop(c.env.TELEGRAM_BOT_TOKEN, chatId);

    // Send a "thinking" placeholder message we'll edit later
    const thinkingMsgId = await sendThinkingMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, lang);

    try {
      // Get or create user's Sandbox
      const sandbox = getSandbox(c.env.Sandbox, `user-${telegramUserId}`, {
        sleepAfter: '10m',
      });

      // Ensure OpenClaw is running
      await ensureOpenClawRunning(sandbox, c.env, message.from, profileData);

      // Update thinking message if Sandbox just booted
      if (thinkingMsgId) {
        await editTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, thinkingMsgId, getThinkingText(lang, 'thinking'));
      }

      // Forward message to OpenClaw via /v1/chat/completions (OpenAI-compatible)
      const gatewayToken = c.env.GATEWAY_TOKEN || GATEWAY_TOKEN;
      
      const messages = [
        {
          role: 'system',
          content: `User: ${profileData.name || message.from.first_name || 'User'} (Telegram ID: ${telegramUserId}). Sender ID for session: telegram:${telegramUserId}`,
        },
        {
          role: 'user',
          content: text,
        },
      ];

      const response = await sandbox.containerFetch(
        new Request('http://localhost/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gatewayToken}`,
          },
          body: JSON.stringify({
            model: 'default',
            messages: messages,
            stream: false,
          }),
        }),
        OPENCLAW_PORT
      );

      let aiResponse: string;
      
      if (response.ok) {
        const data = await response.json() as any;
        aiResponse = data.choices?.[0]?.message?.content 
          || data.response 
          || data.text 
          || 'Hmm, let me try again.';
      } else {
        const errorText = await response.text().catch(() => 'unknown');
        console.error(`OpenClaw error: ${response.status} - ${errorText}`);
        
        if (response.status === 401 || response.status === 403) {
          aiResponse = 'Authentication error with AI service. Please try again later.';
        } else if (response.status === 503) {
          aiResponse = getWakingUpMessage(lang);
        } else {
          aiResponse = 'Sorry, something went wrong. Please try again.';
        }
      }

      // Edit the thinking message with the actual response (or send new if edit fails)
      if (thinkingMsgId) {
        const edited = await editTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, thinkingMsgId, aiResponse);
        if (!edited) {
          await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, aiResponse);
        }
      } else {
        await sendTelegramMessage(c.env.TELEGRAM_BOT_TOKEN, chatId, aiResponse);
      }
    } finally {
      // Always stop the typing loop
      clearInterval(typingInterval);
    }

  } catch (error: any) {
    console.error('Error:', error?.message || error, 'Stack:', error?.stack?.slice(0, 500));
    await sendTelegramMessage(
      c.env.TELEGRAM_BOT_TOKEN, 
      chatId, 
      'Sorry, something went wrong. Please try again.'
    );
  }

  return c.json({ ok: true });
});

// ==========================================
// Handle button callbacks during onboarding
// ==========================================
async function handleCallbackQuery(env: Env, query: any) {
  const telegramUserId = String(query.from.id);
  const chatId = query.message.chat.id;
  const data = query.data;
  
  // Acknowledge the callback
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: query.id }),
  });

  const stateKey = `onboarding/${telegramUserId}.json`;
  const stateObj = await env.UserStorage.get(stateKey);
  
  if (!stateObj) return new Response(JSON.stringify({ ok: true }));
  
  const state: OnboardingState = await stateObj.json();

  // Process callback based on prefix
  if (data.startsWith('lang:')) {
    state.language = data.split(':')[1];
    state.step = 'name';
  } else if (data.startsWith('purpose:')) {
    state.purpose = data.split(':')[1];
    state.step = 'style';
  } else if (data.startsWith('style:')) {
    state.style = data.split(':')[1];
    state.step = 'interests';
  }

  // Save updated state
  await env.UserStorage.put(stateKey, JSON.stringify(state));
  
  // Send next step
  const msg = getOnboardingMessage(state);
  await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.text, msg.buttons);

  return new Response(JSON.stringify({ ok: true }));
}

// ==========================================
// Handle text input during onboarding
// ==========================================
async function handleOnboardingInput(
  env: Env,
  telegramUserId: string,
  chatId: number,
  text: string,
  state: OnboardingState,
  stateKey: string,
  telegramUser: any
) {
  if (state.step === 'name') {
    state.name = text;
    state.step = 'purpose';
  } else if (state.step === 'interests') {
    state.interests = text === '/skip' ? 'Not specified' : text;
    state.step = 'complete';
    
    // Save profile
    const profileKey = `users/${telegramUserId}/profile.json`;
    await env.UserStorage.put(profileKey, JSON.stringify(state));
    
    // Generate and save USER.md and SOUL.md
    const userMd = generateUserMd(state);
    const soulMd = generateSoulMd(state);
    await env.UserStorage.put(`users/${telegramUserId}/USER.md`, userMd);
    await env.UserStorage.put(`users/${telegramUserId}/SOUL.md`, soulMd);
    
    // Clean up onboarding state
    await env.UserStorage.delete(stateKey);
  }

  // Save state if not complete
  if (state.step !== 'complete') {
    await env.UserStorage.put(stateKey, JSON.stringify(state));
  }

  // Send next message
  const msg = getOnboardingMessage(state);
  await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, msg.text, msg.buttons);

  // If complete, start booting Sandbox in background
  if (state.step === 'complete') {
    try {
      const sandbox = getSandbox(env.Sandbox, `user-${telegramUserId}`, {
        sleepAfter: '10m',
      });
      // Fire and forget - boot Sandbox so it's ready for first message
      ensureOpenClawRunning(sandbox, env, telegramUser, state).catch(() => {});
    } catch (e) {
      // Non-critical, Sandbox will boot on first message
    }
  }

  return new Response(JSON.stringify({ ok: true }));
}

// ==========================================
// Ensure OpenClaw is running in Sandbox
// ==========================================
async function ensureOpenClawRunning(
  sandbox: any,
  env: Env,
  telegramUser: any,
  profile: OnboardingState
) {
  // Check if OpenClaw is already running
  try {
    const processes = await sandbox.listProcesses();
    console.log('[Sandbox] Found', processes.length, 'processes');
    
    const running = processes.find(
      (p: any) => (p.command?.includes('clawdbot') || p.command?.includes('start-zaki')) 
        && (p.status === 'running' || p.status === 'starting')
    );

    if (running) {
      console.log('[Sandbox] OpenClaw already running, waiting for port...');
      await running.waitForPort(OPENCLAW_PORT, { mode: 'tcp', timeout: 60_000 });
      console.log('[Sandbox] Ready!');
      return;
    }
  } catch (e: any) {
    console.log('[Sandbox] List/check error:', e?.message);
  }

  // Build env vars
  const processEnv: Record<string, string> = {
    USER_NAME: profile.name || telegramUser.first_name || 'User',
    USER_TELEGRAM_ID: String(telegramUser.id),
    USER_LANGUAGE: profile.language || 'en',
    USER_STYLE: profile.style || 'casual',
    USER_PURPOSE: profile.purpose || 'everything',
    USER_INTERESTS: profile.interests || '',
    GATEWAY_PORT: String(OPENCLAW_PORT),
    GATEWAY_TOKEN: env.GATEWAY_TOKEN || GATEWAY_TOKEN,
  };
  if (env.GOOGLE_API_KEY) processEnv.GOOGLE_API_KEY = env.GOOGLE_API_KEY;
  if (env.ANTHROPIC_API_KEY) processEnv.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.DEFAULT_MODEL) processEnv.DEFAULT_MODEL = env.DEFAULT_MODEL;

  console.log('[Sandbox] Starting OpenClaw with env:', Object.keys(processEnv).join(', '));

  // Start gateway process (SDK 0.7.0 handles env vars properly)
  const proc = await sandbox.startProcess('/usr/local/bin/start-zaki.sh', {
    env: processEnv,
  });
  console.log('[Sandbox] Process started:', proc?.id || proc?.processId);

  // Wait for port
  try {
    await proc.waitForPort(OPENCLAW_PORT, {
      mode: 'tcp',
      timeout: 90_000,
    });
    console.log('[Sandbox] OpenClaw is ready!');
  } catch (portErr: any) {
    // Get process logs to understand why it failed
    console.error('[Sandbox] waitForPort failed:', portErr?.message);
    try {
      const logs = await proc.getLogs();
      console.error('[Sandbox] STDOUT:', logs?.stdout?.slice(0, 800));
      console.error('[Sandbox] STDERR:', logs?.stderr?.slice(0, 800));
    } catch (logErr: any) {
      console.error('[Sandbox] Could not get logs:', logErr?.message);
    }
    throw portErr;
  }
}

// ==========================================
// Thinking / Processing UX
// ==========================================

const THINKING_TEXT: Record<string, Record<string, string>> = {
  booting: {
    en: '⚡ Starting up...',
    ar: '⚡ عم يشتغل...',
    de: '⚡ Starte...',
    fr: '⚡ Démarrage...',
    es: '⚡ Iniciando...',
    tr: '⚡ Başlatılıyor...',
  },
  thinking: {
    en: '🧠 Thinking...',
    ar: '🧠 عم يفكر...',
    de: '🧠 Denke nach...',
    fr: '🧠 Réflexion...',
    es: '🧠 Pensando...',
    tr: '🧠 Düşünüyor...',
  },
};

function getThinkingText(lang: string, phase: 'booting' | 'thinking'): string {
  return THINKING_TEXT[phase]?.[lang] || THINKING_TEXT[phase]?.['en'] || '...';
}

/**
 * Send a "thinking" placeholder message, returns the message ID so we can edit it later
 */
async function sendThinkingMessage(botToken: string, chatId: number, lang: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: getThinkingText(lang, 'booting'),
      }),
    });
    const data = await res.json() as any;
    return data.result?.message_id || null;
  } catch {
    return null;
  }
}

/**
 * Edit an existing message (returns true if successful)
 */
async function editTelegramMessage(botToken: string, chatId: number, messageId: number, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json() as any;
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * Keep sending "typing..." action every 4 seconds (Telegram typing expires after ~5s)
 */
function startTypingLoop(botToken: string, chatId: number): ReturnType<typeof setInterval> {
  sendTypingAction(botToken, chatId); // send immediately
  return setInterval(() => {
    sendTypingAction(botToken, chatId);
  }, 4000);
}

// ==========================================
// Telegram helpers
// ==========================================
async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  buttons?: Array<Array<{ text: string; callback_data: string }>>
) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };

  if (buttons) {
    body.reply_markup = {
      inline_keyboard: buttons,
    };
  }

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sendTypingAction(botToken: string, chatId: number) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      action: 'typing',
    }),
  });
}

export default app;
