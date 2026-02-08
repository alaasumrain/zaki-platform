/**
 * Test Database Connection and Services
 * Run with: npx tsx scripts/test-db.ts
 */

import 'dotenv/config';
import { createServices } from '../src/services';

async function main() {
  console.log('🔌 Connecting to database...');
  
  const services = createServices(process.env.DATABASE_URL!);
  
  console.log('✅ Connected!\n');

  // Simulate a Telegram user
  const telegramUser = {
    id: 12345678,
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
  };

  console.log('📝 Testing onboarding flow...');
  
  // Test the onboarding flow
  const result = await services.onboarding.handleStart(telegramUser);
  
  console.log('\n--- Onboarding Result ---');
  console.log('User ID:', result.user.id);
  console.log('User Telegram ID:', result.user.telegramId);
  console.log('Is New User:', result.isNewUser);
  console.log('Agent Name:', result.agent.name);
  console.log('Agent Model:', result.agent.model);
  console.log('Session ID:', result.session.id);
  console.log('\n--- Welcome Message ---');
  console.log(result.welcomeMessage);

  // Test adding a message
  console.log('\n📨 Testing message flow...');
  
  await services.chat.addMessage({
    sessionId: result.session.id,
    userId: result.user.id,
    role: 'user',
    content: 'Hello! This is a test message.',
  });

  await services.chat.addMessage({
    sessionId: result.session.id,
    userId: result.user.id,
    role: 'assistant',
    content: 'Hello! I received your test message. How can I help you today?',
    model: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    inputTokens: 50,
    outputTokens: 25,
  });

  // Get messages
  const messages = await services.chat.getMessages(result.session.id);
  console.log('\n--- Messages ---');
  messages.forEach(m => {
    console.log(`[${m.role}]: ${m.content?.slice(0, 50)}...`);
  });

  // Build context
  const context = await services.chat.buildContext(result.session.id);
  console.log('\n--- Context for AI ---');
  console.log(JSON.stringify(context, null, 2));

  // Test getting user's agents
  console.log('\n🤖 Testing agent listing...');
  const agents = await services.agent.findByUserId(result.user.id);
  console.log(`Found ${agents.length} agent(s):`);
  agents.forEach(a => {
    console.log(`  - ${a.name} (${a.isDefault ? 'default' : 'custom'})`);
  });

  console.log('\n✅ All tests passed!');
}

main().catch(console.error);
