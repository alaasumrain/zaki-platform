# Usage Tracking Integration Guide

**Date:** 2026-02-09  
**Status:** Ready for Integration

---

## Overview

Usage tracking is now implemented and ready to use. This guide shows how to integrate it with OpenClaw responses.

---

## ✅ What's Already Done

1. **Usage Service** (`src/services/usage.ts`)
   - Records usage with token counts and costs
   - Aggregates statistics
   - Groups by model, provider, date

2. **Cost Calculator** (`src/utils/cost-calculator.ts`)
   - Calculates costs based on model pricing
   - Supports major providers (Anthropic, OpenAI, Google)
   - Estimates costs before execution

3. **Usage Tracker Utilities** (`src/utils/usage-tracker.ts`)
   - Extracts usage from OpenClaw responses
   - Records usage automatically
   - Handles various response formats

4. **Telegram Command** (`/usage`)
   - Shows 30-day statistics
   - Displays costs, tokens, requests
   - Groups by model and date

---

## 🔌 Integration Points

### 1. Automatic Recording (Recommended)

The `saveAssistantResponse` function now automatically records usage if token counts are provided:

```typescript
import { saveAssistantResponse } from './handlers/telegram';

// When OpenClaw returns a response with usage data
await saveAssistantResponse(
  services,
  sessionId,
  userId,
  response.content,
  {
    model: response.model,
    provider: response.provider,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  }
);
```

### 2. Manual Recording

If you have usage data from another source:

```typescript
import { recordUsageFromTokens } from './utils/usage-tracker';

await recordUsageFromTokens(
  services.usage,
  userId,
  inputTokens,
  outputTokens,
  model,
  provider
);
```

### 3. From OpenClaw Response

If OpenClaw returns usage in response metadata:

```typescript
import { recordUsageFromResponse } from './utils/usage-tracker';

// OpenClaw response object
const openClawResponse = {
  content: "...",
  usage: {
    input_tokens: 500,
    output_tokens: 300,
    model: "claude-sonnet-4",
    provider: "anthropic",
  },
};

await recordUsageFromResponse(
  services.usage,
  userId,
  openClawResponse
);
```

---

## 📊 OpenClaw Response Formats

OpenClaw may return usage data in different formats. The `extractUsageFromResponse` function handles:

### Format 1: Top-level usage
```typescript
{
  content: "...",
  usage: {
    input_tokens: 500,
    output_tokens: 300,
    total_tokens: 800,
  },
  model: "claude-sonnet-4",
  provider: "anthropic",
}
```

### Format 2: Metadata usage
```typescript
{
  content: "...",
  metadata: {
    usage: {
      input_tokens: 500,
      output_tokens: 300,
      model: "claude-sonnet-4",
      provider: "anthropic",
    },
  },
}
```

### Format 3: Direct properties
```typescript
{
  content: "...",
  input_tokens: 500,
  output_tokens: 300,
  model: "claude-sonnet-4",
  provider: "anthropic",
}
```

---

## 🎯 Where to Integrate

### Option A: In OpenClaw Gateway Handler

If you have a handler that processes OpenClaw responses:

```typescript
// In your OpenClaw gateway handler
async function handleOpenClawResponse(
  services: Services,
  userId: string,
  sessionId: string,
  openClawResponse: any
) {
  // Extract usage
  const { recordUsageFromResponse } = await import('../utils/usage-tracker');
  
  // Record usage (non-blocking)
  recordUsageFromResponse(
    services.usage,
    userId,
    openClawResponse
  ).catch(err => console.error('Usage tracking failed:', err));
  
  // Save message
  await saveAssistantResponse(
    services,
    sessionId,
    userId,
    openClawResponse.content || openClawResponse.text,
    {
      model: openClawResponse.model || openClawResponse.usage?.model,
      provider: openClawResponse.provider || openClawResponse.usage?.provider,
      inputTokens: openClawResponse.usage?.input_tokens,
      outputTokens: openClawResponse.usage?.output_tokens,
    }
  );
}
```

### Option B: In Instance Manager

If instances communicate via HTTP:

```typescript
// When receiving response from user's OpenClaw instance
async function handleInstanceResponse(
  instanceId: string,
  response: any
) {
  const instance = await instanceManager.getInstance(instanceId);
  const userId = instance.userId;
  
  // Record usage
  const { recordUsageFromResponse } = await import('../utils/usage-tracker');
  await recordUsageFromResponse(services.usage, userId, response);
}
```

### Option C: In Router/API Handler

If you have an API endpoint that receives OpenClaw responses:

```typescript
// POST /api/chat/response
app.post('/api/chat/response', async (req, res) => {
  const { userId, sessionId, response } = req.body;
  
  // Record usage
  const { recordUsageFromResponse } = await import('./utils/usage-tracker');
  await recordUsageFromResponse(services.usage, userId, response);
  
  // Save response
  await saveAssistantResponse(services, sessionId, userId, response.content, {
    model: response.model,
    provider: response.provider,
    inputTokens: response.usage?.input_tokens,
    outputTokens: response.usage?.output_tokens,
  });
  
  res.json({ ok: true });
});
```

---

## 💰 Cost Calculation

Costs are automatically calculated based on model pricing:

```typescript
import { calculateCost, getModelPricing } from './utils/cost-calculator';

// Get pricing for a model
const pricing = getModelPricing('claude-sonnet-4', 'anthropic');
// { inputPricePer1M: 3.0, outputPricePer1M: 15.0 }

// Calculate cost
const cost = calculateCost(500, 300, 'claude-sonnet-4', 'anthropic');
// $0.0015 + $0.0045 = $0.006
```

### Supported Models

- **Anthropic:** Claude Sonnet 4, Opus 4, Haiku, etc.
- **OpenAI:** GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Google:** Gemini Pro, Gemini Ultra

Add more models in `src/utils/cost-calculator.ts` → `MODEL_PRICING`.

---

## 📈 Pre-Run Cost Estimation

Estimate costs before running expensive operations:

```typescript
import { estimateCost, estimateTokens } from './utils/cost-calculator';

// Estimate tokens for input
const inputText = "Analyze this document...";
const estimatedInputTokens = estimateTokens(inputText);

// Estimate output (usually 20-50% of input for summaries)
const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.3);

// Get cost estimate
const estimate = estimateCost(
  estimatedInputTokens,
  estimatedOutputTokens,
  'claude-sonnet-4',
  'anthropic'
);

console.log(`Estimated cost: $${estimate.min.toFixed(4)} - $${estimate.max.toFixed(4)}`);
// Show to user for approval
```

---

## 🧪 Testing

### Test Usage Recording

```typescript
// Test recording usage
await services.usage.recordUsage({
  userId: 'test-user',
  model: 'claude-sonnet-4',
  provider: 'anthropic',
  inputTokens: 100,
  outputTokens: 50,
  costMicrocents: 600, // $0.0006
});

// Check stats
const stats = await services.usage.getUserStats('test-user', 30);
console.log('Total requests:', stats.totalRequests);
console.log('Total cost:', stats.totalCost);
```

### Test Cost Calculation

```typescript
import { calculateCost } from './utils/cost-calculator';

const cost = calculateCost(1000, 500, 'claude-sonnet-4', 'anthropic');
console.log('Cost:', cost); // Should be ~$0.0105
```

---

## 🔍 Debugging

### Check if Usage is Being Recorded

```typescript
// In your handler, log the response
console.log('OpenClaw response:', JSON.stringify(response, null, 2));

// Check what usage data is extracted
import { extractUsageFromResponse } from './utils/usage-tracker';
const usage = extractUsageFromResponse(response);
console.log('Extracted usage:', usage);
```

### Verify Database Records

```sql
-- Check usage table
SELECT * FROM usage 
WHERE user_id = 'your-user-id' 
ORDER BY date DESC 
LIMIT 10;

-- Check totals
SELECT 
  COUNT(*) as requests,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  SUM(cost_microcents) / 1000000.0 as total_cost
FROM usage
WHERE user_id = 'your-user-id';
```

---

## 📝 Next Steps

1. **Find where OpenClaw responses are received**
   - Check instance manager
   - Check router/gateway handlers
   - Check API endpoints

2. **Add usage tracking**
   - Use `recordUsageFromResponse` or `saveAssistantResponse`
   - Ensure token counts are passed

3. **Test with real requests**
   - Send a message
   - Check `/usage` command
   - Verify database records

4. **Monitor and optimize**
   - Review cost calculations
   - Add missing models to pricing
   - Adjust estimates if needed

---

## 🚨 Common Issues

### Issue: No usage recorded

**Check:**
- Is `saveAssistantResponse` being called with metadata?
- Does OpenClaw response include usage data?
- Are token counts > 0?

**Solution:**
```typescript
// Add logging
console.log('Response metadata:', metadata);
console.log('Has usage:', !!metadata?.inputTokens || !!metadata?.outputTokens);
```

### Issue: Costs seem wrong

**Check:**
- Is model name matching pricing table?
- Are token counts correct?
- Is provider specified?

**Solution:**
```typescript
// Verify pricing
import { getModelPricing } from './utils/cost-calculator';
const pricing = getModelPricing(model, provider);
console.log('Pricing:', pricing);
```

### Issue: `/usage` shows "No usage recorded"

**Check:**
- Are records in database?
- Is userId correct?
- Is date range correct?

**Solution:**
```typescript
// Check directly
const stats = await services.usage.getUserStats(userId, 30);
console.log('Stats:', stats);
```

---

## 📚 Related Files

- `src/services/usage.ts` - Usage service
- `src/utils/cost-calculator.ts` - Cost calculation
- `src/utils/usage-tracker.ts` - Usage tracking utilities
- `src/handlers/telegram.ts` - Telegram handlers (includes `/usage`)
- `src/db/schema.ts` - Database schema (usage table)

---

**Last Updated:** 2026-02-09
