/**
 * Agent Service
 * Handles agent creation, lookup, and management
 */

import { eq, and } from 'drizzle-orm';
import { Database } from '../db/client';
import { agents, Agent, NewAgent } from '../db/schema';

// Default system prompt for new agents
const DEFAULT_SYSTEM_PROMPT = `You are a helpful, friendly personal AI assistant. You are:

- Concise but thorough
- Proactive in offering help
- Honest about your limitations
- Respectful of the user's time

Respond naturally and conversationally. If you don't know something, say so.`;

export class AgentService {
  constructor(private db: Database) {}

  /**
   * Find agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    const result = await this.db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get all agents for a user
   */
  async findByUserId(userId: string): Promise<Agent[]> {
    return this.db
      .select()
      .from(agents)
      .where(and(
        eq(agents.userId, userId),
        eq(agents.isActive, true)
      ));
  }

  /**
   * Get the default agent for a user
   */
  async getDefaultAgent(userId: string): Promise<Agent | null> {
    const result = await this.db
      .select()
      .from(agents)
      .where(and(
        eq(agents.userId, userId),
        eq(agents.isDefault, true),
        eq(agents.isActive, true)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create the default agent for a new user
   */
  async createDefaultAgent(userId: string, userName?: string): Promise<Agent> {
    const newAgent: NewAgent = {
      userId,
      name: 'Zaki',
      description: 'Your personal AI assistant',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      model: 'claude-sonnet-4-20250514',
      provider: 'anthropic',
      temperature: 70,
      isDefault: true,
      isActive: true,
      openingMessage: userName 
        ? `Hey ${userName}! 👋 I'm Zaki, your personal AI assistant. What can I help you with today?`
        : `Hey! 👋 I'm Zaki, your personal AI assistant. What can I help you with today?`,
      openingQuestions: [
        "What kind of tasks do you need help with most?",
        "Tell me about a project you're working on",
        "What would make your day easier?",
      ],
    };

    const result = await this.db
      .insert(agents)
      .values(newAgent)
      .returning();

    return result[0];
  }

  /**
   * Create a custom agent
   */
  async create(data: {
    userId: string;
    name: string;
    description?: string;
    systemPrompt?: string;
    model?: string;
    provider?: string;
  }): Promise<Agent> {
    // If this is the user's first agent, make it default
    const existingAgents = await this.findByUserId(data.userId);
    const isDefault = existingAgents.length === 0;

    const newAgent: NewAgent = {
      userId: data.userId,
      name: data.name,
      description: data.description || null,
      systemPrompt: data.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      model: data.model || 'claude-sonnet-4-20250514',
      provider: data.provider || 'anthropic',
      temperature: 70,
      isDefault,
      isActive: true,
    };

    const result = await this.db
      .insert(agents)
      .values(newAgent)
      .returning();

    return result[0];
  }

  /**
   * Update an agent
   */
  async update(id: string, userId: string, data: Partial<NewAgent>): Promise<Agent | null> {
    const result = await this.db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(agents.id, id),
        eq(agents.userId, userId)
      ))
      .returning();

    return result[0] || null;
  }

  /**
   * Set an agent as the default
   */
  async setDefault(id: string, userId: string): Promise<void> {
    // First, unset all defaults for this user
    await this.db
      .update(agents)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(agents.userId, userId));

    // Then set the new default
    await this.db
      .update(agents)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(
        eq(agents.id, id),
        eq(agents.userId, userId)
      ));
  }

  /**
   * Soft delete an agent
   */
  async delete(id: string, userId: string): Promise<void> {
    await this.db
      .update(agents)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(agents.id, id),
        eq(agents.userId, userId)
      ));
  }

  /**
   * Count agents for a user
   */
  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(agents)
      .where(and(
        eq(agents.userId, userId),
        eq(agents.isActive, true)
      ));
    
    return result.length;
  }
}
