/**
 * Database client for Cloudflare Workers
 * Uses Neon's serverless driver for HTTP-based connections
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

// Type exports for use in services
export type { 
  User, NewUser,
  Agent, NewAgent,
  Session, NewSession,
  Message, NewMessage,
  File, NewFile,
  KnowledgeBase, NewKnowledgeBase,
  Chunk, NewChunk,
  Usage, NewUsage,
} from './schema';
