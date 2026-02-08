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

// Track user -> port mapping
const userPorts = new Map();
let nextPort = BASE_PORT + 1;

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
  
  // Create container with WORKING settings
  const container = await docker.createContainer({
    Image: 'alpine/openclaw:latest',
    name: containerName,
    Hostname: containerName,
    ExposedPorts: { '18789/tcp': {} },
    Env: [
      'NODE_OPTIONS=--max-old-space-size=1024'
    ],
    HostConfig: {
      Memory: 2 * 1024 * 1024 * 1024, // 2GB
      PortBindings: { '18789/tcp': [{ HostPort: String(port) }] },
      Binds: [
        `${userDataDir}/.openclaw:/home/node/.openclaw:rw`,
        `${userDataDir}/workspace:/home/node/workspace:rw`
      ],
      RestartPolicy: { Name: 'unless-stopped' }
    }
  });
  
  await container.start();
  
  const info = { port, token, name: userInfo.firstName, username: userInfo.username, created: Date.now() };
  userPorts.set(String(userId), info);
  await saveUserMappings();
  
  console.log(`Container ${containerName} started on port ${port}`);
  
  // Wait for gateway to be ready (takes ~30s to fully start)
  console.log('Waiting for gateway to start...');
  await new Promise(r => setTimeout(r, 35000));
  
  return info;
}

async function sendToContainer(userId, message, info) {
  const url = `http://127.0.0.1:${info.port}/v1/chat/completions`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${info.token}`
      },
      body: JSON.stringify({
        model: 'openclaw',
        user: userId,
        messages: [{ role: 'user', content: message }]
      })
    });
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response';
  } catch (e) {
    console.error(`Error sending to container: ${e.message}`);
    return `Still warming up... try again in 30 secs 🔄`;
  }
}

bot.on('message:text', async (ctx) => {
  const userId = String(ctx.from.id);
  const text = ctx.message.text;
  const userInfo = {
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    username: ctx.from.username
  };
  
  console.log(`[${new Date().toISOString()}] Message from ${userId} (${userInfo.firstName}): ${text.substring(0, 50)}...`);
  
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
          await new Promise(r => setTimeout(r, 30000)); // Wait for startup
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
  const response = await sendToContainer(userId, text, info);
  
  // Split long responses
  if (response.length > 4000) {
    const chunks = response.match(/.{1,4000}/gs) || [response];
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  } else {
    await ctx.reply(response);
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
/help - This message

Just text me anything else - I'm here to help.`);
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
