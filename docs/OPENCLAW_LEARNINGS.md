# OpenClaw Usage Tracking Learnings

**Date:** 2026-02-09  
**Source:** OpenClaw Source Code Analysis

---

## 🔍 Key Findings

### 1. Usage Schema Structure

OpenClaw uses a standardized `Usage` schema:

```typescript
interface Usage {
  input_tokens: number;    // Non-negative integer
  output_tokens: number;    // Non-negative integer
  total_tokens: number;    // Non-negative integer
}
```

**Location:** `src/gateway/open-responses.schema.ts`

### 2. Response Format

OpenClaw responses include usage in the response object:

```typescript
interface ResponseResource {
  id: string;
  status: "in_progress" | "completed" | "failed" | "cancelled" | "incomplete";
  model: string;
  output: OutputItem[];
  usage: Usage;  // ← Usage is at top level
  error?: { code: string; message: string };
}
```

**Key Point:** Usage is always at the top level of the response, not nested deep.

### 3. Session-Based Tracking

OpenClaw tracks usage **per session** and aggregates from session logs:

- Each session has a log file
- Usage is extracted from session transcripts
- Aggregated across sessions for reporting

**Functions:**
- `loadSessionCostSummary()` - Loads usage for a single session
- `loadCostUsageSummary()` - Aggregates across all sessions
- `discoverAllSessions()` - Finds all sessions in date range

**Location:** `src/infra/session-cost-usage.ts`

### 4. Gateway Methods

OpenClaw exposes usage via gateway methods:

```typescript
// Get cost summary
"usage.cost": async ({ respond, params }) => {
  const summary = await loadCostUsageSummaryCached({ startMs, endMs, config });
  respond(true, summary, undefined);
}

// Get session usage
"sessions.usage": async ({ respond, params }) => {
  const result = await loadSessionsUsage({ startMs, endMs, limit });
  respond(true, result, undefined);
}

// Get time series for a session
"sessions.usage.timeseries": async ({ respond, params }) => {
  const timeseries = await loadSessionUsageTimeSeries({ sessionId, maxPoints: 200 });
  respond(true, timeseries, undefined);
}

// Get session logs
"sessions.usage.logs": async ({ respond, params }) => {
  const logs = await loadSessionLogs({ sessionId, limit: 500 });
  respond(true, { logs }, undefined);
}
```

**Location:** `src/gateway/server-methods/usage.ts`

### 5. Aggregation Patterns

OpenClaw aggregates usage by:

- **Model** - Per model breakdown
- **Provider** - Per provider breakdown
- **Agent** - Per agent breakdown
- **Channel** - Per channel breakdown
- **Daily** - Daily breakdown with date strings (YYYY-MM-DD)
- **Tools** - Tool usage counts
- **Messages** - Message counts (user, assistant, tool calls, errors)
- **Latency** - Response latency stats

**Example Structure:**
```typescript
interface SessionsUsageAggregates {
  messages: SessionMessageCounts;
  tools: SessionToolUsage;
  byModel: SessionModelUsage[];
  byProvider: SessionModelUsage[];
  byAgent: Array<{ agentId: string; totals: CostUsageSummary["totals"] }>;
  byChannel: Array<{ channel: string; totals: CostUsageSummary["totals"] }>;
  latency?: SessionLatencyStats;
  dailyLatency?: SessionDailyLatency[];
  modelDaily?: SessionDailyModelUsage[];
  daily: Array<{
    date: string;  // YYYY-MM-DD
    tokens: number;
    cost: number;
    messages: number;
    toolCalls: number;
    errors: number;
  }>;
}
```

### 6. Cost Calculation

OpenClaw calculates costs from:

- **Session logs** - Parses session transcripts for usage data
- **Model pricing** - Uses model pricing config
- **Cache tokens** - Tracks cache read/write separately
- **Missing entries** - Tracks when cost data is missing

**Cost Totals Structure:**
```typescript
interface CostTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  cacheReadCost: number;
  cacheWriteCost: number;
  missingCostEntries: number;  // Count of entries without cost data
}
```

### 7. Date Range Handling

OpenClaw uses UTC dates for consistency:

```typescript
// Parse date string (YYYY-MM-DD) to start of day timestamp in UTC
const parseDateToMs = (raw: string): number => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  const [, year, month, day] = match;
  return Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day));
};

// Default to last 30 days if not provided
const defaultStartMs = todayStartMs - 29 * 24 * 60 * 60 * 1000;
```

**Key Points:**
- Always use UTC for date calculations
- Default to last 30 days
- Support `startDate`, `endDate`, or `days` parameter

### 8. Caching Strategy

OpenClaw caches cost summaries:

```typescript
const COST_USAGE_CACHE_TTL_MS = 30_000; // 30 seconds

const costUsageCache = new Map<string, CostUsageCacheEntry>();

// Cache key: `${startMs}-${endMs}`
// Cache TTL: 30 seconds
```

**Benefits:**
- Reduces repeated file I/O
- Speeds up dashboard queries
- Still fresh enough for real-time updates

### 9. Usage Display

OpenClaw shows usage in multiple places:

- **`/status`** - Current session tokens + estimated cost (API key only)
- **`/usage off|tokens|full`** - Per-response usage footer
- **`/usage cost`** - Local cost summary from session logs
- **CLI: `openclaw status --usage`** - Full per-provider breakdown
- **macOS menu bar** - Usage section under Context

**Key Point:** OAuth tokens show tokens only, API keys show costs.

### 10. Provider Usage Tracking

OpenClaw also tracks provider usage windows (quotas):

- Pulls directly from provider usage endpoints
- Shows quota windows, not estimated costs
- Separate from session-based cost tracking

**Supported Providers:**
- Anthropic (OAuth tokens)
- GitHub Copilot (OAuth tokens)
- Gemini CLI (OAuth tokens)
- MiniMax (API key)
- z.ai (API key)

---

## 🎯 Recommendations for Zaki Platform

### 1. Match OpenClaw Response Format

When receiving OpenClaw responses, expect:

```typescript
{
  id: string;
  status: "completed";
  model: string;
  output: [...],
  usage: {
    input_tokens: number,
    output_tokens: number,
    total_tokens: number
  }
}
```

### 2. Session-Based Tracking

Consider tracking usage per session (like OpenClaw):

- Each session has its own usage log
- Aggregate across sessions for reporting
- Store session metadata (agent, channel, model)

### 3. Enhanced Aggregation

Add more aggregation dimensions:

- By agent
- By channel
- Daily breakdown
- Tool usage
- Message counts
- Latency stats

### 4. Caching

Implement caching for cost summaries:

- 30-second TTL (like OpenClaw)
- Cache key: date range
- Invalidate on new usage

### 5. Date Handling

Use UTC consistently:

- Parse dates as UTC
- Store dates as UTC timestamps
- Format dates as YYYY-MM-DD strings

### 6. Cost Calculation

Track more cost details:

- Cache read/write tokens
- Missing cost entries
- Separate input/output costs

### 7. Gateway Methods

Consider exposing usage via gateway methods:

- `usage.cost` - Cost summary
- `sessions.usage` - Session usage list
- `sessions.usage.timeseries` - Time series data
- `sessions.usage.logs` - Session logs

---

## 📚 Key Files in OpenClaw

1. **`src/gateway/open-responses.schema.ts`** - Usage schema definition
2. **`src/gateway/server-methods/usage.ts`** - Usage gateway methods
3. **`src/infra/session-cost-usage.ts`** - Cost calculation and aggregation
4. **`ui/src/ui/usage-helpers.ts`** - Usage query and filtering
5. **`ui/src/ui/controllers/usage.ts`** - Usage UI controller
6. **`docs/concepts/usage-tracking.md`** - Usage tracking documentation
7. **`docs/reference/api-usage-costs.md`** - API usage and costs guide

---

## 🔄 Integration Points

### Where OpenClaw Records Usage

1. **Session Logs** - Usage is extracted from session transcript files
2. **Agent Responses** - Usage is included in agent response objects
3. **Gateway Responses** - Usage is in OpenResponses API responses

### How to Extract Usage

```typescript
// From OpenClaw response
const usage = response.usage;  // { input_tokens, output_tokens, total_tokens }

// From session log
const sessionLog = await loadSessionLog(sessionId);
const usage = extractUsageFromLog(sessionLog);

// From gateway response
const gatewayResponse = await fetchGatewayResponse(responseId);
const usage = gatewayResponse.usage;
```

---

## ✅ What We Already Have

Our implementation already matches many OpenClaw patterns:

- ✅ Usage schema with input/output tokens
- ✅ Cost calculation
- ✅ Aggregation by model and provider
- ✅ Daily breakdown
- ✅ Date range queries

## 🔧 What We Should Add

Based on OpenClaw learnings:

- ⬜ Session-based tracking (currently user-based)
- ⬜ Cache read/write token tracking
- ⬜ Tool usage tracking
- ⬜ Message counts
- ⬜ Latency stats
- ⬜ Caching for cost summaries
- ⬜ Gateway methods for usage
- ⬜ Time series data

---

**Last Updated:** 2026-02-09
