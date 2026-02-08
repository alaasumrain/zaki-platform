/**
 * Zaki Platform Database Schema
 * Based on LobeChat patterns, simplified for our needs
 */

import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  index,
  primaryKey,
  integer,
} from 'drizzle-orm/pg-core';

// ============================================
// Helpers
// ============================================

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

// ============================================
// Users
// ============================================

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('user')),
    
    // Telegram auth (primary)
    telegramId: text('telegram_id').unique(),
    telegramUsername: text('telegram_username'),
    
    // Optional email (for web later)
    email: text('email').unique(),
    
    // Profile
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatar: text('avatar'),
    
    // Settings
    preferences: jsonb('preferences').default({}),
    isOnboarded: boolean('is_onboarded').default(false),
    
    // Status
    isActive: boolean('is_active').default(true),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow(),
    
    ...timestamps,
  },
  (t) => [
    index('users_telegram_id_idx').on(t.telegramId),
    index('users_email_idx').on(t.email),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// Agents
// ============================================

export const agents = pgTable(
  'agents',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('agent')),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // Identity
    name: text('name').notNull(),
    description: text('description'),
    avatar: text('avatar'),
    
    // Configuration
    systemPrompt: text('system_prompt'),
    model: text('model').default('claude-sonnet-4-20250514'),
    provider: text('provider').default('anthropic'),
    temperature: integer('temperature').default(70), // stored as 0-100, divide by 100
    
    // Features
    enabledTools: jsonb('enabled_tools').default([]),
    knowledgeBaseIds: jsonb('knowledge_base_ids').default([]),
    
    // Opening
    openingMessage: text('opening_message'),
    openingQuestions: jsonb('opening_questions').default([]),
    
    // Status
    isDefault: boolean('is_default').default(false),
    isActive: boolean('is_active').default(true),
    
    ...timestamps,
  },
  (t) => [
    index('agents_user_id_idx').on(t.userId),
  ]
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

// ============================================
// Sessions (Conversations)
// ============================================

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('sess')),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    agentId: text('agent_id').references(() => agents.id, { onDelete: 'set null' }),
    
    // Metadata
    title: text('title'),
    
    // Status
    isPinned: boolean('is_pinned').default(false),
    isArchived: boolean('is_archived').default(false),
    
    ...timestamps,
  },
  (t) => [
    index('sessions_user_id_idx').on(t.userId),
    index('sessions_agent_id_idx').on(t.agentId),
  ]
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// ============================================
// Messages
// ============================================

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('msg')),
    sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // Content
    role: text('role', { enum: ['user', 'assistant', 'system', 'tool'] }).notNull(),
    content: text('content'),
    
    // Rich content (for tool calls, files, etc.)
    metadata: jsonb('metadata').default({}),
    
    // For assistant messages
    model: text('model'),
    provider: text('provider'),
    
    // Token tracking
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    
    // Parent (for threading)
    parentId: text('parent_id').references((): any => messages.id, { onDelete: 'set null' }),
    
    ...timestamps,
  },
  (t) => [
    index('messages_session_id_idx').on(t.sessionId),
    index('messages_user_id_idx').on(t.userId),
    index('messages_created_at_idx').on(t.createdAt),
  ]
);

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

// ============================================
// Files
// ============================================

export const files = pgTable(
  'files',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('file')),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // File info
    name: text('name').notNull(),
    mimeType: text('mime_type'),
    size: integer('size'), // bytes
    
    // Storage
    storageKey: text('storage_key').notNull(), // R2 key
    url: text('url'), // public URL if any
    
    // Hash for dedup
    hash: text('hash'),
    
    ...timestamps,
  },
  (t) => [
    index('files_user_id_idx').on(t.userId),
    index('files_hash_idx').on(t.hash),
  ]
);

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

// ============================================
// Knowledge Bases (for RAG)
// ============================================

export const knowledgeBases = pgTable(
  'knowledge_bases',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('kb')),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    name: text('name').notNull(),
    description: text('description'),
    
    // Settings
    embeddingModel: text('embedding_model').default('text-embedding-3-small'),
    chunkSize: integer('chunk_size').default(1000),
    chunkOverlap: integer('chunk_overlap').default(200),
    
    ...timestamps,
  },
  (t) => [
    index('knowledge_bases_user_id_idx').on(t.userId),
  ]
);

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBases.$inferInsert;

// ============================================
// File to Knowledge Base mapping
// ============================================

export const knowledgeBaseFiles = pgTable(
  'knowledge_base_files',
  {
    knowledgeBaseId: text('knowledge_base_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }).notNull(),
    fileId: text('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
    
    // Processing status
    status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
    error: text('error'),
    
    ...timestamps,
  },
  (t) => [
    primaryKey({ columns: [t.knowledgeBaseId, t.fileId] }),
  ]
);

// ============================================
// Chunks (for RAG embeddings)
// ============================================

export const chunks = pgTable(
  'chunks',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('chunk')),
    knowledgeBaseId: text('knowledge_base_id').references(() => knowledgeBases.id, { onDelete: 'cascade' }).notNull(),
    fileId: text('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // Content
    content: text('content').notNull(),
    
    // Position in document
    index: integer('index').notNull(),
    
    // Metadata
    metadata: jsonb('metadata').default({}),
    
    // Embedding vector - stored as array, use pgvector extension for similarity search
    // Note: Enable pgvector extension: CREATE EXTENSION IF NOT EXISTS vector;
    // Then alter this column: ALTER TABLE chunks ADD COLUMN embedding vector(1536);
    
    ...timestamps,
  },
  (t) => [
    index('chunks_knowledge_base_id_idx').on(t.knowledgeBaseId),
    index('chunks_file_id_idx').on(t.fileId),
  ]
);

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;

// ============================================
// Usage Tracking
// ============================================

export const usage = pgTable(
  'usage',
  {
    id: text('id').primaryKey().$defaultFn(() => generateId('usage')),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // When
    date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
    
    // What
    model: text('model').notNull(),
    provider: text('provider').notNull(),
    
    // How much
    inputTokens: integer('input_tokens').default(0),
    outputTokens: integer('output_tokens').default(0),
    requests: integer('requests').default(1),
    
    // Cost (in microcents for precision)
    costMicrocents: integer('cost_microcents').default(0),
    
    ...timestamps,
  },
  (t) => [
    index('usage_user_id_idx').on(t.userId),
    index('usage_date_idx').on(t.date),
    index('usage_user_date_idx').on(t.userId, t.date),
  ]
);

export type Usage = typeof usage.$inferSelect;
export type NewUsage = typeof usage.$inferInsert;
