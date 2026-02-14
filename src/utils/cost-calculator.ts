/**
 * Cost Calculator
 * Calculates costs based on model, provider, and token usage
 * 
 * Based on OpenClaw patterns and common LLM pricing
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ModelPricing {
  inputPricePer1M: number;  // Price per 1M input tokens
  outputPricePer1M: number; // Price per 1M output tokens
}

/**
 * Model pricing in dollars per 1M tokens
 * Updated as of 2026-02-09
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic
  'claude-sonnet-4': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  'claude-sonnet-4.5': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  'claude-opus-4': { inputPricePer1M: 15.0, outputPricePer1M: 75.0 },
  'claude-opus-4.6': { inputPricePer1M: 15.0, outputPricePer1M: 75.0 },
  'claude-3-5-sonnet': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  'claude-3-opus': { inputPricePer1M: 15.0, outputPricePer1M: 75.0 },
  'claude-3-sonnet': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
  'claude-3-haiku': { inputPricePer1M: 0.25, outputPricePer1M: 1.25 },
  
  // OpenAI
  'gpt-4o': { inputPricePer1M: 2.5, outputPricePer1M: 10.0 },
  'gpt-4-turbo': { inputPricePer1M: 10.0, outputPricePer1M: 30.0 },
  'gpt-4': { inputPricePer1M: 30.0, outputPricePer1M: 60.0 },
  'gpt-3.5-turbo': { inputPricePer1M: 0.5, outputPricePer1M: 1.5 },
  
  // Google
  'gemini-pro': { inputPricePer1M: 0.5, outputPricePer1M: 1.5 },
  'gemini-ultra': { inputPricePer1M: 1.25, outputPricePer1M: 5.0 },
  
  // Default fallback (Claude Sonnet pricing)
  'default': { inputPricePer1M: 3.0, outputPricePer1M: 15.0 },
};

/**
 * Get pricing for a model
 */
export function getModelPricing(model: string, provider?: string): ModelPricing {
  // Try exact model match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }
  
  // Try provider-specific variants
  if (provider) {
    const providerModel = `${provider}-${model}`;
    if (MODEL_PRICING[providerModel]) {
      return MODEL_PRICING[providerModel];
    }
  }
  
  // Try model name without version
  const baseModel = model.split('-').slice(0, -1).join('-');
  if (baseModel && MODEL_PRICING[baseModel]) {
    return MODEL_PRICING[baseModel];
  }
  
  // Fallback to default
  return MODEL_PRICING['default'];
}

/**
 * Calculate cost in dollars from token usage
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: string,
  provider?: string
): number {
  const pricing = getModelPricing(model, provider);
  
  const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePer1M;
  
  return inputCost + outputCost;
}

/**
 * Calculate cost in microcents (for database storage)
 */
export function calculateCostMicrocents(
  inputTokens: number,
  outputTokens: number,
  model: string,
  provider?: string
): number {
  const costInDollars = calculateCost(inputTokens, outputTokens, model, provider);
  return Math.round(costInDollars * 1_000_000); // Convert to microcents
}

/**
 * Estimate token usage for a text string
 * Rough estimation: ~4 characters per token for English
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 4 chars per token for English
  // More accurate: count words and multiply by 1.3
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Estimate cost before running a task
 */
export function estimateCost(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  model: string,
  provider?: string
): {
  min: number;
  likely: number;
  max: number;
} {
  const baseCost = calculateCost(
    estimatedInputTokens,
    estimatedOutputTokens,
    model,
    provider
  );
  
  // Add variance: ±30% for estimation uncertainty
  return {
    min: baseCost * 0.7,
    likely: baseCost,
    max: baseCost * 1.3,
  };
}
