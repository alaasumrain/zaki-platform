/**
 * Usage Service
 * Handles usage tracking and analytics
 */

import { eq, and, gte } from 'drizzle-orm';
import { Database } from '../db/client';
import { usage, Usage } from '../db/schema';

export interface UsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number; // in dollars
  byModel: Array<{
    model: string;
    provider: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
  byDate: Array<{
    date: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
}

export class UsageService {
  constructor(private db: Database) {}

  /**
   * Record usage for a request
   */
  async recordUsage(data: {
    userId: string;
    model: string;
    provider: string;
    inputTokens?: number;
    outputTokens?: number;
    costMicrocents?: number;
  }): Promise<Usage> {
    const result = await this.db
      .insert(usage)
      .values({
        userId: data.userId,
        model: data.model,
        provider: data.provider,
        inputTokens: data.inputTokens || 0,
        outputTokens: data.outputTokens || 0,
        costMicrocents: data.costMicrocents || 0,
        requests: 1,
      })
      .returning();

    return result[0];
  }

  /**
   * Get usage statistics for a user
   */
  async getUserStats(
    userId: string,
    days: number = 30
  ): Promise<UsageStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all usage records for the user
    const allUsage = await this.db
      .select()
      .from(usage)
      .where(
        and(
          eq(usage.userId, userId),
          gte(usage.date, startDate)
        )
      );

    // Calculate totals
    const totalRequests = allUsage.length;
    const totalInputTokens = allUsage.reduce((sum, u) => sum + (u.inputTokens || 0), 0);
    const totalOutputTokens = allUsage.reduce((sum, u) => sum + (u.outputTokens || 0), 0);
    const totalCostMicrocents = allUsage.reduce((sum, u) => sum + (u.costMicrocents || 0), 0);
    const totalCost = totalCostMicrocents / 1000000; // Convert microcents to dollars

    // Group by model
    const byModelMap = new Map<string, {
      model: string;
      provider: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      costMicrocents: number;
    }>();

    for (const u of allUsage) {
      const key = `${u.provider}:${u.model}`;
      const existing = byModelMap.get(key) || {
        model: u.model,
        provider: u.provider || 'unknown',
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        costMicrocents: 0,
      };

      existing.requests += 1;
      existing.inputTokens += u.inputTokens || 0;
      existing.outputTokens += u.outputTokens || 0;
      existing.costMicrocents += u.costMicrocents || 0;

      byModelMap.set(key, existing);
    }

    const byModel = Array.from(byModelMap.values()).map(item => ({
      model: item.model,
      provider: item.provider,
      requests: item.requests,
      inputTokens: item.inputTokens,
      outputTokens: item.outputTokens,
      cost: item.costMicrocents / 1000000, // Convert to dollars
    }));

    // Group by date
    const byDateMap = new Map<string, {
      date: string;
      requests: number;
      inputTokens: number;
      outputTokens: number;
      costMicrocents: number;
    }>();

    for (const u of allUsage) {
      const dateKey = u.date.toISOString().split('T')[0]; // YYYY-MM-DD
      const existing = byDateMap.get(dateKey) || {
        date: dateKey,
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        costMicrocents: 0,
      };

      existing.requests += 1;
      existing.inputTokens += u.inputTokens || 0;
      existing.outputTokens += u.outputTokens || 0;
      existing.costMicrocents += u.costMicrocents || 0;

      byDateMap.set(dateKey, existing);
    }

    const byDate = Array.from(byDateMap.values())
      .map(item => ({
        date: item.date,
        requests: item.requests,
        inputTokens: item.inputTokens,
        outputTokens: item.outputTokens,
        cost: item.costMicrocents / 1000000, // Convert to dollars
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      totalInputTokens,
      totalOutputTokens,
      totalCost,
      byModel,
      byDate,
    };
  }

  /**
   * Get recent usage (last N days)
   */
  async getRecentUsage(userId: string, days: number = 7): Promise<Usage[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.db
      .select()
      .from(usage)
      .where(
        and(
          eq(usage.userId, userId),
          gte(usage.date, startDate)
        )
      )
      .orderBy(usage.date);
  }
}
