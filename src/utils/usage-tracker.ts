/**
 * Usage Tracker
 * Helper utilities for tracking usage from OpenClaw responses
 */

import { UsageService } from '../services/usage';
import { calculateCostMicrocents } from './cost-calculator';

export interface OpenClawUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  model?: string;
  provider?: string;
}

/**
 * Extract usage from OpenClaw response
 * 
 * OpenClaw supports multiple API formats:
 * 
 * 1. OpenAI-compatible (`/v1/chat/completions`):
 *    {
 *      choices: [...],
 *      usage: {
 *        prompt_tokens: number,
 *        completion_tokens: number,
 *        total_tokens: number
 *      }
 *    }
 * 
 * 2. OpenResponses API (`/v1/responses`):
 *    {
 *      id: string,
 *      status: "completed",
 *      model: string,
 *      usage: {
 *        input_tokens: number,
 *        output_tokens: number,
 *        total_tokens: number
 *      }
 *    }
 */
export function extractUsageFromResponse(response: any): OpenClawUsage | null {
  // Format 1: OpenAI-compatible (what router/index.js uses)
  if (response.usage) {
    const usage = response.usage;
    
    // OpenAI format: prompt_tokens, completion_tokens
    if (usage.prompt_tokens !== undefined || usage.completion_tokens !== undefined) {
      return {
        input_tokens: usage.prompt_tokens ?? 0,
        output_tokens: usage.completion_tokens ?? 0,
        total_tokens: usage.total_tokens ?? ((usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0)),
        model: response.model,
        provider: response.provider,
      };
    }
    
    // OpenResponses format: input_tokens, output_tokens
    if (usage.input_tokens !== undefined || usage.output_tokens !== undefined) {
      return {
        input_tokens: usage.input_tokens ?? 0,
        output_tokens: usage.output_tokens ?? 0,
        total_tokens: usage.total_tokens ?? ((usage.input_tokens ?? 0) + (usage.output_tokens ?? 0)),
        model: response.model ?? usage.model,
        provider: response.provider ?? usage.provider,
      };
    }
    
    // Generic format: inputTokens, outputTokens (camelCase)
    if (usage.inputTokens !== undefined || usage.outputTokens !== undefined) {
      return {
        input_tokens: usage.inputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
        total_tokens: usage.totalTokens ?? ((usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)),
        model: response.model ?? usage.model,
        provider: response.provider ?? usage.provider,
      };
    }
  }
  
  // Fallback: Check metadata (some older formats)
  if (response.metadata?.usage) {
    const usage = response.metadata.usage;
    return {
      input_tokens: usage.input_tokens ?? usage.prompt_tokens ?? usage.inputTokens ?? 0,
      output_tokens: usage.output_tokens ?? usage.completion_tokens ?? usage.outputTokens ?? 0,
      total_tokens: usage.total_tokens ?? usage.totalTokens ?? 0,
      model: usage.model ?? response.model,
      provider: usage.provider ?? response.provider,
    };
  }
  
  // Fallback: Direct properties (legacy format)
  if (response.input_tokens !== undefined || response.output_tokens !== undefined || 
      response.prompt_tokens !== undefined || response.completion_tokens !== undefined) {
    return {
      input_tokens: response.input_tokens ?? response.prompt_tokens ?? 0,
      output_tokens: response.output_tokens ?? response.completion_tokens ?? 0,
      total_tokens: response.total_tokens ?? 0,
      model: response.model,
      provider: response.provider,
    };
  }
  
  return null;
}

/**
 * Record usage from OpenClaw response
 */
export async function recordUsageFromResponse(
  usageService: UsageService,
  userId: string,
  response: any,
  fallbackModel?: string,
  fallbackProvider?: string
): Promise<void> {
  const usage = extractUsageFromResponse(response);
  
  if (!usage) {
    // No usage data found - skip recording
    console.warn('No usage data found in response:', {
      hasUsage: !!response.usage,
      hasMetadata: !!response.metadata,
      keys: Object.keys(response),
    });
    return;
  }
  
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const model = usage.model || fallbackModel || 'unknown';
  const provider = usage.provider || fallbackProvider || 'unknown';
  
  // Skip if no tokens
  if (inputTokens === 0 && outputTokens === 0) {
    return;
  }
  
  // Calculate cost
  const costMicrocents = calculateCostMicrocents(
    inputTokens,
    outputTokens,
    model,
    provider
  );
  
  // Record usage
  await usageService.recordUsage({
    userId,
    model,
    provider,
    inputTokens,
    outputTokens,
    costMicrocents,
  });
}

/**
 * Record usage from explicit token counts
 */
export async function recordUsageFromTokens(
  usageService: UsageService,
  userId: string,
  inputTokens: number,
  outputTokens: number,
  model: string,
  provider?: string
): Promise<void> {
  if (inputTokens === 0 && outputTokens === 0) {
    return;
  }
  
  const costMicrocents = calculateCostMicrocents(
    inputTokens,
    outputTokens,
    model,
    provider
  );
  
  await usageService.recordUsage({
    userId,
    model,
    provider: provider || 'unknown',
    inputTokens,
    outputTokens,
    costMicrocents,
  });
}
