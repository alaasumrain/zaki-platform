/**
 * Usage Tracker for Router (JavaScript)
 * Records usage to database via HTTP or direct DB connection
 */

// Try to load TypeScript modules (works if tsx is available)
let UsageService, createDb, calculateCostMicrocents;
let canUseTS = false;

try {
  // Try using tsx to load TypeScript
  const tsx = require('tsx');
  const dbModule = require('../src/db/client.ts');
  const usageModule = require('../src/services/usage.ts');
  const costModule = require('../src/utils/cost-calculator.ts');
  
  UsageService = usageModule.UsageService;
  createDb = dbModule.createDb;
  calculateCostMicrocents = costModule.calculateCostMicrocents;
  canUseTS = true;
  console.log('[Usage] TypeScript modules loaded via tsx');
} catch (error) {
  // Fallback: will log usage but not save to DB
  console.warn('[Usage] Cannot load TypeScript modules, usage will be logged only:', error.message);
  console.warn('[Usage] Install tsx: npm install -g tsx (or use compiled JS)');
}

let usageService = null;

/**
 * Initialize usage service
 */
function initUsageService() {
  if (!canUseTS) return null;
  if (usageService) return usageService;
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn('[Usage] DATABASE_URL not set, usage tracking disabled');
    return null;
  }
  
  try {
    const db = createDb(databaseUrl);
    usageService = new UsageService(db);
    console.log('[Usage] Service initialized');
    return usageService;
  } catch (error) {
    console.error('[Usage] Failed to initialize:', error.message);
    return null;
  }
}

/**
 * Extract usage from OpenClaw response
 * Handles both OpenAI-compatible and OpenResponses formats
 */
function extractUsage(response) {
  if (!response.usage) return null;
  
  const usage = response.usage;
  
  // OpenAI format: prompt_tokens, completion_tokens
  if (usage.prompt_tokens !== undefined || usage.completion_tokens !== undefined) {
    return {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      total_tokens: usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0)),
      model: response.model || 'openclaw',
      provider: 'openclaw',
    };
  }
  
  // OpenResponses format: input_tokens, output_tokens
  if (usage.input_tokens !== undefined || usage.output_tokens !== undefined) {
    return {
      input_tokens: usage.input_tokens || 0,
      output_tokens: usage.output_tokens || 0,
      total_tokens: usage.total_tokens || ((usage.input_tokens || 0) + (usage.output_tokens || 0)),
      model: response.model || 'openclaw',
      provider: response.provider || 'openclaw',
    };
  }
  
  return null;
}

/**
 * Record usage from OpenClaw response
 */
async function recordUsage(userId, response) {
  const service = initUsageService();
  if (!service) {
    // Log but don't fail if service unavailable
    const usage = extractUsage(response);
    if (usage) {
      console.log(`[Usage] User ${userId}: ${usage.input_tokens} input, ${usage.output_tokens} output tokens (not saved - no DB)`);
    }
    return;
  }
  
  const usage = extractUsage(response);
  if (!usage) {
    return; // No usage data
  }
  
  if (usage.input_tokens === 0 && usage.output_tokens === 0) {
    return; // Skip zero usage
  }
  
  try {
    // Calculate cost
    const costMicrocents = calculateCostMicrocents(
      usage.input_tokens,
      usage.output_tokens,
      usage.model,
      usage.provider
    );
    
    // Record usage
    await service.recordUsage({
      userId,
      model: usage.model,
      provider: usage.provider,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      costMicrocents,
    });
    
    console.log(`[Usage] Recorded: User ${userId}, ${usage.input_tokens} input + ${usage.output_tokens} output tokens, $${(costMicrocents / 1000000).toFixed(6)}`);
  } catch (error) {
    // Log but don't fail the request
    console.error(`[Usage] Failed to record usage for user ${userId}:`, error.message);
  }
}

module.exports = {
  recordUsage,
  extractUsage,
  initUsageService,
};
