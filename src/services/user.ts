/**
 * User Service
 * Handles user creation, lookup, and updates
 */

import { eq } from 'drizzle-orm';
import { Database } from '../db/client';
import { users, User, NewUser } from '../db/schema';

export class UserService {
  constructor(private db: Database) {}

  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create a new user from Telegram
   */
  async createFromTelegram(telegramUser: {
    id: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    const newUser: NewUser = {
      telegramId: String(telegramUser.id),
      telegramUsername: telegramUser.username || null,
      firstName: telegramUser.first_name || null,
      lastName: telegramUser.last_name || null,
      isOnboarded: false,
      isActive: true,
    };

    const result = await this.db
      .insert(users)
      .values(newUser)
      .returning();

    return result[0];
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const result = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Mark user as onboarded
   */
  async markOnboarded(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ isOnboarded: true, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({ lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  /**
   * Get or create user from Telegram
   * Main entry point for Telegram auth
   */
  async getOrCreateFromTelegram(telegramUser: {
    id: number | string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ user: User; isNew: boolean }> {
    const existing = await this.findByTelegramId(String(telegramUser.id));
    
    if (existing) {
      // Update last active
      await this.updateLastActive(existing.id);
      return { user: existing, isNew: false };
    }

    const user = await this.createFromTelegram(telegramUser);
    return { user, isNew: true };
  }
}
