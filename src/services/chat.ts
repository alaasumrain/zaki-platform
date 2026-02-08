/**
 * Chat Service
 * Handles sessions and messages
 */

import { eq, and, desc } from 'drizzle-orm';
import { Database } from '../db/client';
import { sessions, messages, Session, NewSession, Message, NewMessage } from '../db/schema';

export class ChatService {
  constructor(private db: Database) {}

  // ============================================
  // Sessions
  // ============================================

  /**
   * Create a new session
   */
  async createSession(userId: string, agentId: string, title?: string): Promise<Session> {
    const newSession: NewSession = {
      userId,
      agentId,
      title: title || null,
      isPinned: false,
      isArchived: false,
    };

    const result = await this.db
      .insert(sessions)
      .values(newSession)
      .returning();

    return result[0];
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get recent sessions for a user
   */
  async getRecentSessions(userId: string, limit = 10): Promise<Session[]> {
    return this.db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.isArchived, false)
      ))
      .orderBy(desc(sessions.updatedAt))
      .limit(limit);
  }

  /**
   * Get or create active session for user + agent
   */
  async getOrCreateActiveSession(userId: string, agentId: string): Promise<Session> {
    // Find most recent non-archived session for this agent
    const recent = await this.db
      .select()
      .from(sessions)
      .where(and(
        eq(sessions.userId, userId),
        eq(sessions.agentId, agentId),
        eq(sessions.isArchived, false)
      ))
      .orderBy(desc(sessions.updatedAt))
      .limit(1);

    if (recent[0]) {
      return recent[0];
    }

    // Create new session
    return this.createSession(userId, agentId);
  }

  /**
   * Update session title
   */
  async updateSessionTitle(id: string, title: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ title, updatedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  /**
   * Archive a session
   */
  async archiveSession(id: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  // ============================================
  // Messages
  // ============================================

  /**
   * Add a message to a session
   */
  async addMessage(data: {
    sessionId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: Record<string, any>;
    model?: string;
    provider?: string;
    inputTokens?: number;
    outputTokens?: number;
    parentId?: string;
  }): Promise<Message> {
    const newMessage: NewMessage = {
      sessionId: data.sessionId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      metadata: data.metadata || {},
      model: data.model || null,
      provider: data.provider || null,
      inputTokens: data.inputTokens || null,
      outputTokens: data.outputTokens || null,
      parentId: data.parentId || null,
    };

    const result = await this.db
      .insert(messages)
      .values(newMessage)
      .returning();

    // Update session's updatedAt
    await this.db
      .update(sessions)
      .set({ updatedAt: new Date() })
      .where(eq(sessions.id, data.sessionId));

    return result[0];
  }

  /**
   * Get messages for a session
   */
  async getMessages(sessionId: string, limit = 50): Promise<Message[]> {
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt)
      .limit(limit);
  }

  /**
   * Get recent messages for context
   */
  async getRecentMessages(sessionId: string, limit = 20): Promise<Message[]> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    
    // Reverse to get chronological order
    return result.reverse();
  }

  /**
   * Get message count for a session
   */
  async getMessageCount(sessionId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId));
    
    return result.length;
  }

  /**
   * Build conversation context for AI
   */
  async buildContext(sessionId: string, maxMessages = 20): Promise<Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>> {
    const msgs = await this.getRecentMessages(sessionId, maxMessages);
    
    return msgs
      .filter(m => m.role !== 'tool') // Exclude tool messages from context
      .map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content || '',
      }));
  }
}
