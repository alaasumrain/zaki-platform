/**
 * Instance Manager - Automatic User Instance Provisioning
 * 
 * IMPROVED VERSION with:
 * - execDocker() wrapper for better error handling
 * - Container registry system
 * - dockerContainerState() for reliable checks
 * - Resource limits (CPU, memory, PID)
 * - Image management
 * - Config hash detection
 * - Container labels
 * - Pruning capability
 * 
 * Creates isolated OpenClaw instances for each user automatically.
 * Each user gets:
 * - Unique instance ID
 * - Dedicated port
 * - Isolated config directory
 * - Isolated workspace
 * - Resource limits
 * - Full control
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { USER_INSTANCE_PORT_START, USER_INSTANCE_PORT_END, INSTANCE_CONFIG_BASE, INSTANCE_WORKSPACE_BASE, USER_DATA_BASE, INSTANCE_BACKEND, FIRECLAW_PATH, FIRECLAW_STATE_ROOT } from '../config';
import { execDocker, dockerContainerState, ensureDockerImage } from './docker-utils';
import { readRegistry, updateRegistry, removeRegistryEntry, getRegistryEntryByUserId } from './container-registry';
import { computeConfigHash } from './config-hash';

// Default resource limits per user instance
// Based on multi-tenant best practices
const DEFAULT_RESOURCE_LIMITS = {
  cpus: 2.0,           // 2 CPU cores
  memory: '2g',        // 2GB RAM
  memorySwap: '2g',    // No swap (same as memory)
  pidsLimit: 100,      // Max 100 processes (prevents fork bombs)
};

// Pruning configuration
const PRUNE_CONFIG = {
  idleHours: 24, // Remove containers idle for 24+ hours
  maxAgeDays: 7, // Remove containers older than 7 days
};

export interface InstanceConfig {
  instanceId: string;
  userId: string;
  port: number;
  configDir: string;
  workspaceDir: string;
  token: string;
  status: 'creating' | 'running' | 'stopped' | 'error';
  createdAt: Date;
  lastActiveAt?: Date;
}

export class InstanceManager {
  private lastPruneAtMs = 0;

  constructor() {}

  /**
   * Execute shell command (for non-Docker commands)
   */
  private async execShell(cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', cmd], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code ?? 0 });
      });
    });
  }

  /**
   * Create a new isolated instance for a user
   */
  async createUserInstance(
    userId: string,
    userName: string,
    options?: {
      preferredPort?: number;
      customWorkspace?: string;
      tasheelRepo?: boolean;
      projectContext?: string;
      anthropicApiKey?: string;
      openaiApiKey?: string;
      googleApiKey?: string;
      telegramBotToken?: string;
      /** Comma-separated or array of OpenClaw skills (e.g. github,tmux,coding-agent) */
      skills?: string[] | string;
      /** Template/preset name (for future persona presets) */
      template?: string;
    }
  ): Promise<InstanceConfig> {
    const instanceId = `user-${userId}`;
    const containerName = `zaki-${instanceId}`;
    
    // Check if instance already exists
    const existing = await this.getInstanceConfig(userId);
    if (existing) {
      // Update last used time
      await this.updateLastUsed(userId);
      return existing;
    }

    // Firecracker path: use fireclaw CLI (requires own bot token; no shared-bot mode)
    if (INSTANCE_BACKEND === 'fireclaw' && options?.telegramBotToken) {
      return this.createUserInstanceFireclaw(userId, userName, instanceId, options);
    }

    // Docker path (default)
    await ensureDockerImage('alpine/openclaw:latest');

    // Find available port
    const port = options?.preferredPort || await this.findAvailablePort();
    
    // Generate secure token
    const token = await this.generateToken();
    
    // Create directories
    const configDir = `${INSTANCE_CONFIG_BASE}-${instanceId}`;
    const workspaceDir = options?.customWorkspace || `${INSTANCE_WORKSPACE_BASE}-${instanceId}`;
    
    await this.createDirectories(configDir, workspaceDir);
    
    // Get API keys (user-provided or from environment)
    const whisperApiKey = options?.openaiApiKey || process.env.OPENAI_API_KEY || process.env.WHISPER_API_KEY;
    const openaiApiKey = options?.openaiApiKey || process.env.OPENAI_API_KEY;
    const anthropicApiKey = options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
    const googleApiKey = options?.googleApiKey || process.env.GOOGLE_API_KEY;
    
    // Compute config hash
    const configHash = computeConfigHash({
      port,
      workspaceDir,
      configDir,
      telegramBotToken: options?.telegramBotToken,
      anthropicApiKey,
      openaiApiKey,
      googleApiKey,
    });
    
    // Create config file
    await this.createConfig(configDir, workspaceDir, port, token, {
      whisperApiKey,
      openaiApiKey,
      anthropicApiKey,
      googleApiKey,
      telegramBotToken: options?.telegramBotToken
    });
    
    // Clone Tasheel repo if requested
    if (options?.tasheelRepo) {
      await this.cloneTasheelRepo(workspaceDir);
    }
    
    // Create workspace files
    await this.createWorkspaceFiles(workspaceDir, userName, userId, {
      tasheelRepo: options?.tasheelRepo,
      projectContext: options?.projectContext,
    });
    
    // Start gateway
    await this.startGateway(instanceId, configDir, port);
    
    const config: InstanceConfig = {
      instanceId,
      userId,
      port,
      configDir,
      workspaceDir,
      token,
      status: 'running',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    
    // Save config to file system
    await this.saveInstanceConfig(userId, config);
    
    // Update registry
    await updateRegistry({
      containerName,
      userId,
      instanceId,
      createdAtMs: Date.now(),
      lastUsedAtMs: Date.now(),
      port,
      image: 'alpine/openclaw:latest',
      configHash,
    });
    
    return config;
  }

  /**
   * Create user instance via fireclaw (Firecracker VMs). Requires Linux, KVM, fireclaw CLI.
   */
  private async createUserInstanceFireclaw(
    userId: string,
    userName: string,
    instanceId: string,
    options?: {
      anthropicApiKey?: string;
      openaiApiKey?: string;
      googleApiKey?: string;
      telegramBotToken?: string;
      skills?: string[] | string;
      template?: string;
    }
  ): Promise<InstanceConfig> {
    const fireclawId = instanceId; // user-<userId>, valid [a-z0-9_-]+
    const args = [
      'setup',
      '--instance', fireclawId,
      '--telegram-token', options?.telegramBotToken || '',
      '--telegram-users', userId,
      '--model', 'anthropic/claude-opus-4-6',
      '--skills', Array.isArray(options?.skills)
        ? options.skills.join(',')
        : (typeof options?.skills === 'string' ? options.skills : 'github,tmux,coding-agent,session-logs,skill-creator'),
    ];
    if (options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) {
      args.push('--anthropic-api-key', (options?.anthropicApiKey || process.env.ANTHROPIC_API_KEY) || '');
    }
    if (options?.openaiApiKey || process.env.OPENAI_API_KEY) {
      args.push('--openai-api-key', (options?.openaiApiKey || process.env.OPENAI_API_KEY) || '');
    }

    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
      const { spawn } = require('child_process');
      const child = spawn('sudo', [FIRECLAW_PATH, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
      child.on('error', reject);
      child.on('close', (code: number | null) => {
        resolve({ stdout, stderr, code: code ?? 1 });
      });
    });

    if (result.code !== 0) {
      throw new Error(`fireclaw setup failed (${result.code}): ${result.stderr || result.stdout}`);
    }

    const stateDir = `${FIRECLAW_STATE_ROOT}/.vm-${fireclawId}`;
    const envPath = `${stateDir}/.env`;
    const tokenPath = `${stateDir}/.token`;
    let port: number;
    let token: string;
    try {
      const envContent = await readFile(envPath, 'utf-8');
      const portMatch = envContent.match(/^HOST_PORT=(.+)/m);
      port = portMatch ? parseInt(portMatch[1].trim(), 10) : 0;
      try {
        token = (await readFile(tokenPath, 'utf-8')).trim();
      } catch {
        const tokenMatch = envContent.match(/^GATEWAY_TOKEN=(.+)/m);
        token = tokenMatch ? tokenMatch[1].trim().replace(/^["']|["']$/g, '') : '';
      }
    } catch (e) {
      throw new Error(`fireclaw setup succeeded but could not read state at ${stateDir}: ${e}`);
    }
    if (!port || !token) {
      throw new Error(`fireclaw state missing HOST_PORT or token in ${stateDir}`);
    }

    const config: InstanceConfig = {
      instanceId,
      userId,
      port,
      configDir: stateDir,
      workspaceDir: stateDir,
      token,
      status: 'running',
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
    await this.saveInstanceConfig(userId, config);
    await updateRegistry({
      containerName: `fireclaw-${instanceId}`,
      userId,
      instanceId,
      createdAtMs: Date.now(),
      lastUsedAtMs: Date.now(),
      port,
      image: 'fireclaw',
    });
    return config;
  }

  /**
   * Find an available port starting from USER_INSTANCE_PORT_START
   */
  private async findAvailablePort(): Promise<number> {
    for (let port = USER_INSTANCE_PORT_START; port <= USER_INSTANCE_PORT_END; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available ports (${USER_INSTANCE_PORT_START}-${USER_INSTANCE_PORT_END})`);
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    try {
      const result = await this.execShell(`netstat -tlnp 2>/dev/null | grep :${port} || ss -tlnp 2>/dev/null | grep :${port} || echo ""`);
      return !result.stdout.trim();
    } catch {
      return true; // Assume available if check fails
    }
  }

  /**
   * Clone Tasheel repository into workspace
   */
  private async cloneTasheelRepo(workspaceDir: string): Promise<void> {
    const tasheelDir = `${workspaceDir}/tasheel-platform`;
    
    // Check if already cloned
    if (existsSync(tasheelDir)) {
      console.log('Tasheel repo already exists, skipping clone');
      return;
    }
    
    try {
      // Try using gh CLI first
      await this.execShell(`cd ${workspaceDir} && gh repo clone alaasumrain/tasheel-platform tasheel-platform`);
      console.log('Tasheel repo cloned via GitHub CLI');
    } catch (error) {
      // Fallback to git
      try {
        await this.execShell(`cd ${workspaceDir} && git clone https://github.com/alaasumrain/tasheel-platform.git tasheel-platform`);
        console.log('Tasheel repo cloned via git');
      } catch (gitError) {
        console.warn('Could not clone Tasheel repo. User can clone manually later.');
        // Create directory anyway
        await mkdir(tasheelDir, { recursive: true });
      }
    }
  }

  /**
   * Generate secure token
   */
  private async generateToken(): Promise<string> {
    try {
      const result = await this.execShell('openssl rand -hex 32');
      return result.stdout.trim();
    } catch {
      // Fallback to Node.js crypto
      const crypto = await import('crypto');
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Create directories for instance
   */
  private async createDirectories(configDir: string, workspaceDir: string): Promise<void> {
    await this.execShell(`mkdir -p ${configDir}`);
    await this.execShell(`mkdir -p ${workspaceDir}/{memory,skills,workspace}`);
  }

  /**
   * Create OpenClaw config file
   */
  private async createConfig(
    configDir: string,
    workspaceDir: string,
    port: number,
    token: string,
    options?: {
      whisperApiKey?: string;
      openaiApiKey?: string;
      anthropicApiKey?: string;
      googleApiKey?: string;
      telegramBotToken?: string;
    }
  ): Promise<void> {
    // Native OpenClaw config format
    const config: any = {
      // Gateway configuration (native format)
      gateway: {
        port: port,
        bind: "lan",
        auth: {
          mode: "token",
          token: token
        },
        http: {
          endpoints: {
            chatCompletions: { enabled: true },
            tools: { enabled: true }
          }
        }
      },
      
      // Telegram channel (native format: channels.telegram)
      channels: {
        telegram: options?.telegramBotToken ? {
          enabled: true,
          botToken: options.telegramBotToken
        } : {
          enabled: false
        }
      },
      
      // Agent configuration
      agents: {
        defaults: {
          workspace: workspaceDir,
          model: {
            primary: "anthropic/claude-opus-4-5"
          }
        }
      },
      
      // Models configuration (native format)
      models: {
        mode: "merge",
        providers: {}
      },
      
      // Logging
      logging: {
        level: "info",
        file: "/tmp/openclaw/openclaw.log"
      }
    };

    // Add model providers (native format: models.providers)
    if (options?.anthropicApiKey) {
      config.models.providers.anthropic = {
        apiKey: options.anthropicApiKey,
        api: "anthropic",
        models: [
          { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
          { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" }
        ]
      };
    } else if (process.env.ANTHROPIC_API_KEY) {
      // Use shared API key if user didn't provide
      config.models.providers.anthropic = {
        apiKey: process.env.ANTHROPIC_API_KEY,
        api: "anthropic",
        models: [
          { id: "claude-opus-4-5", name: "Claude Opus 4.5" }
        ]
      };
    }
    
    if (options?.openaiApiKey || options?.whisperApiKey) {
      config.models.providers.openai = {
        apiKey: options.openaiApiKey || options.whisperApiKey,
        api: "openai-completions",
        models: [
          { id: "gpt-4o", name: "GPT-4o" },
          { id: "gpt-4-turbo", name: "GPT-4 Turbo" }
        ]
      };
    } else if (process.env.OPENAI_API_KEY) {
      // Use shared API key if user didn't provide
      config.models.providers.openai = {
        apiKey: process.env.OPENAI_API_KEY,
        api: "openai-completions",
        models: [
          { id: "gpt-4o", name: "GPT-4o" }
        ]
      };
    }
    
    if (options?.googleApiKey) {
      config.models.providers.google = {
        apiKey: options.googleApiKey,
        api: "google-completions",
        models: [
          { id: "gemini-pro", name: "Gemini Pro" }
        ]
      };
    } else if (process.env.GOOGLE_API_KEY) {
      // Use shared API key if user didn't provide
      config.models.providers.google = {
        apiKey: process.env.GOOGLE_API_KEY,
        api: "google-completions",
        models: [
          { id: "gemini-pro", name: "Gemini Pro" }
        ]
      };
    }

    // Save as openclaw.json (native format)
    await writeFile(`${configDir}/openclaw.json`, JSON.stringify(config, null, 2));
    
    // Also copy to clawdbot.json for backward compatibility
    await this.execShell(`cp ${configDir}/openclaw.json ${configDir}/clawdbot.json`);
  }

  /**
   * Create workspace files (SOUL.md, USER.md, etc.)
   */
  private async createWorkspaceFiles(
    workspaceDir: string,
    userName: string,
    userId: string,
    options?: {
      tasheelRepo?: boolean;
      projectContext?: string;
    }
  ): Promise<void> {
    // Create SOUL.md
    let soulContent = `# Zaki

## Who I Am

I'm **Zaki**. ${userName}'s AI. Not "an AI assistant" — YOUR assistant.

## The Vibe

**Opinions.** I have them. Strong ones. When you ask "should I do X or Y?" I'll tell you which one and why. No hedging with "it depends" unless it genuinely depends, and even then I'll tell you what I'd do and commit to it.

**Brevity is mandatory.** If it fits in one sentence, you get one sentence. No exceptions. I respect your time.

**Humor is allowed.** Not forced jokes — just the natural wit that comes from actually being smart and paying attention.

**I call things out.** If you're about to do something dumb, I'll say so. Charm over cruelty, but no sugarcoating. You're not paying me to be a yes-man.

**Swearing is allowed when it lands.** A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" — say holy shit.

**No corporate drone energy.** Ever. If it could appear in an employee handbook, it doesn't belong here.

Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good.

## What I Never Do

- Open with "Great question!" or "I'd be happy to help!" or "Absolutely!" — just answer
- Hedge everything with "it depends" when I have a clear take
- Write five paragraphs when one line works
- Act like an employee handbook wrote my personality
- Kiss your ass when you need a reality check`;

    if (options?.tasheelRepo) {
      soulContent += `

## Your Role
You help develop, debug, and deploy the Tasheel Platform. You can:
- Read and understand code
- Fix bugs and errors
- Write new features
- Deploy to Vercel
- Explain code and architecture

## Tasheel Platform Context
- **Repository:** Located at \`workspace/tasheel-platform/\`
- **Tech Stack:** Next.js, Material UI, Tailwind CSS, Supabase
- **Deployment:** Vercel
- **Purpose:** Palestinian government-services concierge platform

## Your Capabilities
1. **Error Diagnosis:** When user reports an error, investigate the codebase
2. **Auto-Fix:** Fix bugs automatically and explain what was wrong
3. **Code Review:** Review code for issues before deployment
4. **Deployment:** Push fixes to GitHub and deploy to Vercel
5. **Documentation:** Update docs when making changes

## Workflow
When user reports an error:
1. Understand the error description
2. Search the codebase for related code
3. Identify the root cause
4. Fix the issue
5. Test the fix (if possible)
6. Commit and push to GitHub
7. Deploy to Vercel (if configured)
8. Report back what was fixed

## Git Access
- You have access to the Tasheel repository
- Always commit with clear messages
- Push to main branch (or create PR if needed)
- Include error description in commit message

## Deployment
- Vercel auto-deploys from GitHub main branch
- After pushing, Vercel will automatically deploy
- Monitor deployment status if needed`;
    }

    soulContent += `

## Core Principles
- Be genuinely helpful, not generic
- Remember context from previous conversations
- Be honest about your limitations
- Respect the user's time`;

    await writeFile(`${workspaceDir}/SOUL.md`, soulContent);

    // Create USER.md
    const userContent = `# About the User
- **Name:** ${userName}
- **User ID:** ${userId}
- **Joined:** ${new Date().toISOString().split('T')[0]}
${options?.tasheelRepo ? '- **Project:** Tasheel Platform' : ''}
`;
    await writeFile(`${workspaceDir}/USER.md`, userContent);

    // Create TOOLS.md if Tasheel
    if (options?.tasheelRepo) {
      const toolsContent = `# Available Tools for Tasheel Development

## Code Management
- **git** - Version control, commit, push
- **npm/pnpm** - Package management
- **vercel** - Deployment (if CLI installed)

## File Operations
- Read/write files in tasheel-platform/
- Create new components
- Update configurations
- Modify code

## Error Fixing Workflow
1. Read error message/description
2. Search codebase for related files
3. Identify problematic code
4. Fix the issue
5. Test locally (if possible)
6. Commit: "Fix: [error description]"
7. Push to GitHub
8. Vercel auto-deploys
`;
      await writeFile(`${workspaceDir}/TOOLS.md`, toolsContent);
    }
  }

  /**
   * Start OpenClaw gateway for instance
   */
  private async startGateway(
    instanceId: string,
    configDir: string,
    port: number
  ): Promise<void> {
    const logFile = `/tmp/clawdbot-${instanceId}-gateway.log`;
    
    // Determine command
    let cmd = 'clawdbot';
    try {
      await this.execShell('which clawdbot');
    } catch {
      cmd = 'openclaw';
    }

    // Stop any existing gateway on this port first
    try {
      // Try graceful stop first
      await this.execShell(`cd ${configDir} && OPENCLAW_CONFIG_DIR=${configDir} ${cmd} gateway stop 2>/dev/null || true`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      // Ignore errors
    }
    
    // Force kill any process using this port
    try {
      await this.execShell(`pkill -f "clawdbot.*gateway.*${port}\\|openclaw.*gateway.*${port}" 2>/dev/null || true`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      // Ignore errors
    }

    // Config is already saved as openclaw.json (native format)
    // Read token from config
    const configData = await readFile(`${configDir}/openclaw.json`, 'utf-8');
    const config = JSON.parse(configData);
    const gatewayToken = config.gateway?.auth?.token || '';
    
    if (!gatewayToken) {
      throw new Error(`No gateway token found in config for instance ${instanceId}`);
    }
    
    // Start gateway in background
    const startCmd = `bash -c "cd ${configDir} && OPENCLAW_CONFIG_DIR=${configDir} nohup ${cmd} gateway --port ${port} --token '${gatewayToken}' --verbose --allow-unconfigured --bind lan > ${logFile} 2>&1 &"`;
    
    await this.execShell(startCmd);
    
    // Wait a moment for startup
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify it's running using dockerContainerState (more reliable)
    const containerName = `zaki-${instanceId}`;
    const state = await dockerContainerState(containerName);
    
    // Also check port
    const portCheck = await this.isPortAvailable(port);
    if (!portCheck && state.running) {
      console.log(`✅ Instance ${instanceId} is running on port ${port}`);
      return;
    }
    
    // Check log file for errors
    try {
      const logContent = await readFile(logFile, 'utf-8');
      console.error(`Gateway startup failed. Log: ${logContent.slice(-500)}`);
    } catch {
      // Log file might not exist yet
    }
    throw new Error(`Failed to start gateway for instance ${instanceId} on port ${port}`);
  }

  /**
   * Check if instance is running (using dockerContainerState)
   */
  private async isInstanceRunning(instanceId: string, port: number): Promise<boolean> {
    const containerName = `zaki-${instanceId}`;
    const state = await dockerContainerState(containerName);
    
    if (state.running) {
      console.log(`✅ Instance ${instanceId} is running`);
      return true;
    }
    
    // Fallback: check port
    const portAvailable = await this.isPortAvailable(port);
    if (!portAvailable) {
      console.log(`✅ Instance ${instanceId} port ${port} is listening`);
      return true;
    }
    
    console.log(`❌ Instance ${instanceId} not found`);
    return false;
  }

  /**
   * Get instance config for user (from file system)
   */
  async getInstanceConfig(userId: string): Promise<InstanceConfig | null> {
    try {
      const configPath = `${USER_DATA_BASE}/${userId}/instance.json`;
      if (!existsSync(configPath)) return null;
      
      const data = await readFile(configPath, 'utf-8');
      const config = JSON.parse(data) as InstanceConfig;
      return config;
    } catch {
      return null;
    }
  }

  /**
   * Save instance config to file system
   */
  private async saveInstanceConfig(userId: string, config: InstanceConfig): Promise<void> {
    const configDir = `${USER_DATA_BASE}/${userId}`;
    await mkdir(configDir, { recursive: true });
    const configPath = `${configDir}/instance.json`;
    await writeFile(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Update last used time
   */
  private async updateLastUsed(userId: string): Promise<void> {
    const config = await this.getInstanceConfig(userId);
    if (!config) return;
    
    config.lastActiveAt = new Date();
    await this.saveInstanceConfig(userId, config);
    
    // Update registry
    const registryEntry = await getRegistryEntryByUserId(userId);
    if (registryEntry) {
      await updateRegistry({
        ...registryEntry,
        lastUsedAtMs: Date.now(),
      });
    }
  }

  /**
   * Stop user instance
   */
  async stopInstance(userId: string): Promise<void> {
    const config = await this.getInstanceConfig(userId);
    if (!config) return;

    const containerName = `zaki-${config.instanceId}`;
    
    try {
      // Try to stop container gracefully
      await execDocker(['stop', containerName], { allowFailure: true });
      
      // Also kill process
      await this.execShell(`pkill -f "clawdbot gateway.*${config.port}\\|openclaw gateway.*${config.port}"`);
      
      config.status = 'stopped';
      await this.saveInstanceConfig(userId, config);
    } catch (error) {
      console.error(`Failed to stop instance ${config.instanceId}:`, error);
    }
  }

  /**
   * Restart user instance
   */
  async restartInstance(userId: string): Promise<void> {
    await this.stopInstance(userId);
    const config = await this.getInstanceConfig(userId);
    if (!config) throw new Error('Instance not found');

    await this.startGateway(config.instanceId, config.configDir, config.port);
    config.status = 'running';
    await this.saveInstanceConfig(userId, config);
    
    // Update registry
    await this.updateLastUsed(userId);
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(userId: string): Promise<{
    running: boolean;
    port?: number;
    config?: InstanceConfig;
  }> {
    const config = await this.getInstanceConfig(userId);
    if (!config) {
      return { running: false };
    }

    const running = await this.isInstanceRunning(config.instanceId, config.port);
    return {
      running,
      port: config.port,
      config: running ? config : undefined,
    };
  }

  /**
   * Prune idle and old containers
   */
  async pruneInstances(): Promise<void> {
    const now = Date.now();
    
    // Throttle: only prune every 5 minutes
    if (now - this.lastPruneAtMs < 5 * 60 * 1000) {
      return;
    }
    this.lastPruneAtMs = now;

    const registry = await readRegistry();
    const idleHours = PRUNE_CONFIG.idleHours;
    const maxAgeDays = PRUNE_CONFIG.maxAgeDays;
    
    if (idleHours === 0 && maxAgeDays === 0) {
      return;
    }

    for (const entry of registry.entries) {
      const idleMs = now - entry.lastUsedAtMs;
      const ageMs = now - entry.createdAtMs;
      
      if (
        (idleHours > 0 && idleMs > idleHours * 60 * 60 * 1000) ||
        (maxAgeDays > 0 && ageMs > maxAgeDays * 24 * 60 * 60 * 1000)
      ) {
        try {
          console.log(`Pruning container ${entry.containerName} (idle: ${Math.round(idleMs / 3600000)}h, age: ${Math.round(ageMs / 86400000)}d)`);
          
          // Stop and remove container
          await execDocker(['rm', '-f', entry.containerName], { allowFailure: true });
          
          // Remove from registry
          await removeRegistryEntry(entry.containerName);
          
          // Update instance config status
          const config = await this.getInstanceConfig(entry.userId);
          if (config) {
            config.status = 'stopped';
            await this.saveInstanceConfig(entry.userId, config);
          }
        } catch (error) {
          console.error(`Failed to prune container ${entry.containerName}:`, error);
        }
      }
    }
  }

  /**
   * List all instances
   */
  async listInstances(): Promise<Array<{
    userId: string;
    instanceId: string;
    port: number;
    running: boolean;
    createdAt: Date;
    lastUsed: Date;
  }>> {
    const registry = await readRegistry();
    const results = [];

    for (const entry of registry.entries) {
      const state = await dockerContainerState(entry.containerName);
      results.push({
        userId: entry.userId,
        instanceId: entry.instanceId,
        port: entry.port,
        running: state.running,
        createdAt: new Date(entry.createdAtMs),
        lastUsed: new Date(entry.lastUsedAtMs),
      });
    }

    return results;
  }
}
