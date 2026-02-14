import { Bot } from 'grammy';
import Docker from 'dockerode';
import fs from 'fs/promises';

// Config
const BOT_TOKEN = '8517348591:AAH0-wsbFUn0so3JO-yN_BsV32Khw6IUs6Q';
const MOONSHOT_API_KEY = 'sk-AwNlaCINvYe91ztHkT5C3LBkppxaj0hY7GdyBZemSwbn6Uqx';
const BASE_PORT = 19000;
const DATA_DIR = '/var/zaki-platform/users';

const docker = new Docker();
const bot = new Bot(BOT_TOKEN);
const { recordUsage } = require('./usage-tracker');

// Track user -> port mapping
const userPorts = new Map();
let nextPort = BASE_PORT + 1;

// Track conversation history per user (keeps last 20 messages)
const conversationHistory = new Map();

async function loadUserMappings() {
  try {
    const data = await fs.readFile('/var/zaki-platform/router/users.json', 'utf8');
    const users = JSON.parse(data);
    for (const [userId, info] of Object.entries(users)) {
      userPorts.set(userId, info);
      if (info.port >= nextPort) nextPort = info.port + 1;
    }
    console.log(`Loaded ${userPorts.size} user mappings`);
  } catch (e) {
    console.log('No existing user mappings, starting fresh');
  }
}

async function saveUserMappings() {
  const obj = Object.fromEntries(userPorts);
  await fs.writeFile('/var/zaki-platform/router/users.json', JSON.stringify(obj, null, 2));
}

async function getContainer(userId) {
  const containerName = `zaki-user-${userId}`;
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    return { container, running: info.State.Running };
  } catch (e) {
    return { container: null, running: false };
  }
}

/**
 * Split response at sentence boundaries (better than arbitrary split)
 */
function splitResponse(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text];
  
  // Try to split at sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Wait for OpenClaw gateway to be ready (health check)
 * Returns true when ready, false if timeout
 */
async function waitForGatewayReady(port, maxWait = 30) {
  for (let i = 0; i < maxWait; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const response = await fetch(`http://127.0.0.1:${port}/health`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Gateway ready on port ${port} after ${i + 1}s`);
        return true;
      }
    } catch (e) {
      // Not ready yet, continue waiting
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.warn(`⚠️ Gateway on port ${port} not ready after ${maxWait}s`);
  return false;
}

async function provisionContainer(userId, userInfo) {
  const containerName = `zaki-user-${userId}`;
  const userDataDir = `${DATA_DIR}/user-${userId}`;
  const port = nextPort++;
  const token = `zaki-token-${userId}-${Date.now()}`;
  
  console.log(`Provisioning container for user ${userId} on port ${port}...`);
  
  // Create user data directories
  await fs.mkdir(`${userDataDir}/.openclaw`, { recursive: true });
  await fs.mkdir(`${userDataDir}/workspace`, { recursive: true });
  
  // WORKING config format (tested!)
  const config = {
    gateway: {
      port: 18789,
      bind: "lan",
      auth: { mode: "token", token: token },
      http: {
        endpoints: {
          chatCompletions: { enabled: true }
        }
      }
    },
    agents: {
      defaults: {
        model: { primary: "moonshot/kimi-k2-0905-preview" },
        models: { "moonshot/kimi-k2-0905-preview": {} }
      }
    },
    models: {
      mode: "merge",
      providers: {
        moonshot: {
          baseUrl: "https://api.moonshot.ai/v1",
          apiKey: MOONSHOT_API_KEY,
          api: "openai-completions",
          models: [{ id: "kimi-k2-0905-preview", name: "Kimi K2" }]
        }
      }
    },
    channels: { telegram: { enabled: false } }
  };
  
  await fs.writeFile(`${userDataDir}/.openclaw/openclaw.json`, JSON.stringify(config, null, 2));
  
  // Create personalized SOUL.md
  const soul = `# Zaki - Your Personal AI Assistant

You are Zaki, a personal AI assistant for ${userInfo.firstName || 'this user'}.

## Your Personality
- Helpful, friendly, and direct
- Get things done efficiently
- Remember context from our conversations

## What You Can Do
- Answer questions and have conversations
- Help with tasks and problem-solving
- Be a reliable assistant

You're running on Zaki Platform - a personal AI network.
`;

  await fs.writeFile(`${userDataDir}/workspace/SOUL.md`, soul);
  
  // Create IDENTITY.md
  const identity = `# IDENTITY.md - Who Am I?

- **Name:** Zaki
- **Creature:** AI assistant
- **Vibe:** Direct, helpful, gets stuff done. No fluff.
- **Emoji:** 🤖

## My Role
Personal assistant to ${userInfo.firstName || 'this user'}.

## How I Work
- Read files, understand code, provide insights
- Research when needed
- Remember context and preferences
`;
  await fs.writeFile(`${userDataDir}/workspace/IDENTITY.md`, identity);
  
  // Create USER.md
  const user = `# USER.md - About You

- **Name:** ${userInfo.firstName || 'Unknown'}
- **Username:** ${userInfo.username ? '@' + userInfo.username : 'Not set'}
- **Telegram ID:** ${userId}
- **Notes:** (add your preferences here)
`;
  await fs.writeFile(`${userDataDir}/workspace/USER.md`, user);
  
  // Create MEMORY.md (long-term memory)
  const memory = `# MEMORY.md - Long-term Memory

## About ${userInfo.firstName || 'User'}
- First connected: ${new Date().toISOString().split('T')[0]}
- Platform: Telegram

## Key Facts
(I'll remember important things here)

## Preferences
(Your preferences will be noted here)
`;
  await fs.writeFile(`${userDataDir}/workspace/MEMORY.md`, memory);
  
  // Create memory/ folder for daily notes
  await fs.mkdir(`${userDataDir}/workspace/memory`, { recursive: true });
  const today = new Date().toISOString().split('T')[0];
  const dailyMemory = `# ${today} - Session Notes

## First Contact
- User: ${userInfo.firstName || 'Unknown'} (@${userInfo.username || 'n/a'})
- Platform: Telegram
- Container provisioned
`;
  await fs.writeFile(`${userDataDir}/workspace/memory/${today}.md`, dailyMemory);
  
  // Create TOOLS.md
  const tools = `# TOOLS.md - Tool Notes

## Available Tools
- Web search
- File operations
- Code execution (sandboxed)
- Memory system

## Notes
(Add tool-specific notes here)
`;
  await fs.writeFile(`${userDataDir}/workspace/TOOLS.md`, tools);
  
  // Create HEARTBEAT.md (empty by default)
  await fs.writeFile(`${userDataDir}/workspace/HEARTBEAT.md`, `# HEARTBEAT.md\n\n# Keep empty to skip heartbeat checks\n`);
  
  // Set permissions for container user (node = uid 1000)
  await fs.chmod(`${userDataDir}/.openclaw`, 0o777);
  await fs.chmod(`${userDataDir}/workspace`, 0o777);
  await fs.chmod(`${userDataDir}/workspace/memory`, 0o777);
  // Make all workspace files writable
  const workspaceFiles = await fs.readdir(`${userDataDir}/workspace`);
  for (const file of workspaceFiles) {
    const path = `${userDataDir}/workspace/${file}`;
    const stat = await fs.stat(path);
    if (stat.isFile()) await fs.chmod(path, 0o666);
  }
  await fs.chmod(`${userDataDir}/.openclaw/openclaw.json`, 0o666);
  
  // Create container with WORKING settings + Resource Quotas
  const container = await docker.createContainer({
    Image: 'alpine/openclaw:latest',
    name: containerName,
    Hostname: containerName,
    ExposedPorts: { '18789/tcp': {} },
    Env: [
      'NODE_OPTIONS=--max-old-space-size=1024'
    ],
    HostConfig: {
      // Memory limits (2GB)
      Memory: 2 * 1024 * 1024 * 1024, // 2GB
      MemorySwap: 2 * 1024 * 1024 * 1024, // Same as memory (no swap)
      // CPU limits (2 CPUs)
      CpuQuota: 200000, // 2 CPUs (100000 = 1 CPU)
      CpuPeriod: 100000,
      // PID limit (prevent fork bombs)
      PidsLimit: 100,
      // Port bindings
      PortBindings: { '18789/tcp': [{ HostPort: String(port) }] },
      // Volume mounts
      Binds: [
        `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
        `${userDataDir}/workspace:/home/node/workspace:rw`
      ],
      // Restart policy
      RestartPolicy: { Name: 'unless-stopped' },
      // Security options
      SecurityOpt: ['no-new-privileges']
    }
  });
  
  await container.start();
  
  const info = { port, token, name: userInfo.firstName, username: userInfo.username, created: Date.now() };
  userPorts.set(String(userId), info);
  await saveUserMappings();
  
  console.log(`Container ${containerName} started on port ${port}`);
  
  // Wait for gateway to be ready (health check instead of fixed wait)
  console.log('Waiting for gateway to start...');
  const ready = await waitForGatewayReady(port, 40); // Max 40s wait
  if (!ready) {
    console.warn(`⚠️ Gateway on port ${port} not ready after 40s, but continuing...`);
  }
  
  return info;
}

async function sendToContainer(userId, message, info, retries = 3) {
  const url = `http://127.0.0.1:${info.port}/v1/chat/completions`;
  
  // Load conversation history for this user
  let history = conversationHistory.get(userId) || [];
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      // Build messages array with conversation history
      const messages = [
        ...history,
        { role: 'user', content: message }
      ];
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${info.token}`
        },
        body: JSON.stringify({
          model: 'openclaw',
          user: userId,
          messages: messages  // Include conversation history
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const text = await response.text();
        
        // Check for session lock errors
        if (text.includes('session file locked') || text.includes('timeout')) {
          console.warn(`[Attempt ${attempt + 1}/${retries}] Session lock detected for user ${userId}, retrying...`);
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); // Exponential backoff
            continue;
          }
          // Last attempt failed - try to clean locks
          console.log(`Cleaning stale locks for user ${userId}...`);
          try {
            const { exec } = require('child_process');
            exec(`docker exec zaki-user-${userId} find /home/node/.openclaw -name "*.lock" -mmin +30 -delete 2>/dev/null || true`, () => {});
          } catch (e) {
            // Ignore cleanup errors
          }
          return `⚠️ Session busy. Please try again in a moment. If this persists, the AI might be processing another request.`;
        }
        
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const data = await response.json();
      
      // Extract response text
      const responseText = data.choices?.[0]?.message?.content || 'No response';
      
      // Update conversation history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: responseText });
      // Keep last 20 messages (prevent context overflow)
      conversationHistory.set(userId, history.slice(-20));
      
      // Record usage from OpenClaw response (non-blocking)
      // Format: { choices: [...], usage: { prompt_tokens, completion_tokens, total_tokens } }
      if (data.usage) {
        recordUsage(userId, data).catch(err => {
          console.error(`[Usage] Error recording usage:`, err.message);
        });
      }
      
      return responseText;
    } catch (e) {
      if (e.name === 'AbortError' || e.message.includes('timeout')) {
        if (attempt < retries - 1) {
          console.warn(`[Attempt ${attempt + 1}/${retries}] Timeout for user ${userId}, retrying...`);
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        return `⏱️ Request timed out. The AI might be busy. Please try again.`;
      }
      
      if (attempt === retries - 1) {
        console.error(`Error sending to container after ${retries} attempts: ${e.message}`);
        if (e.message.includes('ECONNREFUSED') || e.message.includes('fetch failed')) {
          return `🔄 Your AI is starting up... please try again in 30 seconds.`;
        } else if (e.message.includes('timeout') || e.name === 'AbortError') {
          return `⏱️ The AI is taking longer than usual. This might be a complex request. Try again?`;
        } else if (e.message.includes('session file locked')) {
          return `⚠️ Your AI is busy processing another request. Please wait a moment.`;
        }
        return `❌ Something went wrong. Please try again or use /help for support.`;
      }
      
      // Retry on other errors
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  
  return `Still warming up... try again in 30 secs 🔄`;
}

bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from.id);
  const text = ctx.message.text;
  const userInfo = {
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username
  };
  
  console.log(`[${new Date().toISOString()}] 📨 Message from ${userId} (${userInfo.firstName}): ${text.substring(0, 50)}...`);
  console.log(`  → Routing to container via Zaki Setup Assistant → zaki-user-${userId}`);
  
  let info = userPorts.get(userId);
  
  if (!info) {
    // New user - provision container
    await ctx.reply(`Hey ${userInfo.firstName}! 👋 First time here - spinning up YOUR personal AI. Takes about 40 seconds, grab a coffee ☕`);
    try {
      info = await provisionContainer(userId, userInfo);
      await ctx.reply('You\'re in. Let\'s go 🔥');
    } catch (e) {
      console.error(`Failed to provision: ${e.message}`);
      await ctx.reply(`❌ Setup failed: ${e.message}`);
      return;
    }
  } else {
    // Check if container is running
    const { container, running } = await getContainer(userId);
    if (!running) {
      await ctx.reply('One sec, waking up... 💤');
      if (container) {
        try {
          await container.start();
          // Wait for gateway to be ready (health check instead of fixed wait)
          const ready = await waitForGatewayReady(info.port);
          if (!ready) {
            await ctx.reply('⏱️ Taking longer than expected... still starting up.');
          }
        } catch (e) {
          console.error(`Failed to start container: ${e.message}`);
        }
      } else {
        // Container doesn't exist, reprovision
        info = await provisionContainer(userId, userInfo);
      }
    }
  }
  
  // Send to container and get response
  console.log(`  → Sending to container on port ${info.port}...`);
  const response = await sendToContainer(userId, text, info);
  console.log(`  ← Response received (${response.length} chars)`);
  
  // Split long responses (sentence-aware)
  const chunks = splitResponse(response);
  for (let i = 0; i < chunks.length; i++) {
    const prefix = chunks.length > 1 ? `[${i + 1}/${chunks.length}] ` : '';
    await ctx.reply(prefix + chunks[i]);
  }
});

// Handle /start command
bot.command('start', async (ctx) => {
  const name = ctx.from.first_name || 'there';
  await ctx.reply(`Yo ${name} 👋

I'm Zaki - your personal AI. Not a chatbot. YOUR agent.

Own instance. Own memory. I remember everything.

Just text me like you'd text a friend. Let's build something.`);
});

// Handle /status command
bot.command('status', async (ctx) => {
  const userId = String(ctx.from.id);
  const info = userPorts.get(userId);
  
  if (!info) {
    await ctx.reply('No instance yet. Send me a message to create one.');
    return;
  }
  
  const { running } = await getContainer(userId);
  await ctx.reply(`${running ? '🟢 Online' : '💤 Sleeping'} | Created ${new Date(info.created).toLocaleDateString()}`);
});

// Handle /reset command - fresh conversation
bot.command('reset', async (ctx) => {
  const userId = String(ctx.from.id);
  const info = userPorts.get(userId);
  
  if (!info) {
    await ctx.reply('No instance to reset.');
    return;
  }
  
  // Clear conversation history
  conversationHistory.delete(userId);
  
  // Send /new to the container to reset session
  await sendToContainer(userId, '/new', info);
  await ctx.reply('Fresh start. What\'s on your mind?');
});

// Handle /help command
bot.command('help', async (ctx) => {
  await ctx.reply(`**Zaki Commands**

/start - Welcome message
/status - Check your AI status
/reset - Fresh conversation (clears context)
/usage - Check your usage stats
/help - This message

Just text me anything else - I'm here to help.`);
});

// Handle /usage command
bot.command('usage', async (ctx) => {
  const userId = String(ctx.from.id);
  
  try {
    // Try to load usage service
    const { initUsageService } = require('./usage-tracker');
    const service = initUsageService();
    
    if (!service) {
      await ctx.reply(`**Usage Stats** 📊\n\n_Usage tracking is being set up. Check back soon!_`);
      return;
    }
    
    const stats = await service.getUserStats(userId, 30);
    
    if (stats.totalRequests === 0) {
      await ctx.reply(`**Usage Stats** 📊\n\n_No usage recorded yet. Start chatting to see your stats!_\n\nDuring beta, enjoy unlimited conversations! 🎉`);
      return;
    }
    
    // Format stats
    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const avgTokensPerRequest = Math.round(totalTokens / stats.totalRequests);
    
    let message = `**Usage Stats (Last 30 Days)** 📊\n\n`;
    message += `**Overview:**\n`;
    message += `• Requests: ${stats.totalRequests.toLocaleString()}\n`;
    message += `• Total Tokens: ${totalTokens.toLocaleString()}\n`;
    message += `  └ Input: ${stats.totalInputTokens.toLocaleString()}\n`;
    message += `  └ Output: ${stats.totalOutputTokens.toLocaleString()}\n`;
    message += `• Avg per Request: ${avgTokensPerRequest.toLocaleString()} tokens\n`;
    
    if (stats.totalCost > 0) {
      message += `• Estimated Cost: $${stats.totalCost.toFixed(4)}\n`;
    }
    
    // Show top models
    if (stats.byModel.length > 0) {
      message += `\n**By Model:**\n`;
      const topModels = stats.byModel
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5);
      
      for (const model of topModels) {
        const modelTokens = model.inputTokens + model.outputTokens;
        message += `• ${model.model} (${model.provider}):\n`;
        message += `  ${model.requests} requests, ${modelTokens.toLocaleString()} tokens`;
        if (model.cost > 0) {
          message += `, $${model.cost.toFixed(4)}`;
        }
        message += `\n`;
      }
    }
    
    message += `\n_Stats update in real-time as you chat._`;
    
    await ctx.reply(message);
  } catch (error) {
    console.error('Error fetching usage:', error);
    await ctx.reply(`**Usage Stats** 📊\n\n_Sorry, couldn't fetch your stats right now. Please try again later._`);
  }
});

async function main() {
  await fs.mkdir('/var/zaki-platform/router', { recursive: true });
  await loadUserMappings();
  
  console.log('🤖 Zaki Router starting...');
  console.log(`Bot token: ${BOT_TOKEN.substring(0, 15)}...`);
  console.log(`Users loaded: ${userPorts.size}`);
  
  bot.start({
    onStart: (info) => console.log(`✅ Bot @${info.username} is running!`)
  });
}

main().catch(console.error);
