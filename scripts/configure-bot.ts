#!/usr/bin/env tsx
/**
 * Configure Bot Name and Description
 * 
 * Sets up the bot as "Zaki - Setup Assistant"
 * 
 * Usage:
 *   tsx scripts/configure-bot.ts
 *   # or
 *   TELEGRAM_BOT_TOKEN=your-token tsx scripts/configure-bot.ts
 */

import { configureSetupBot, getBotInfo } from '../src/utils/bot-config';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
  console.error('   Usage: TELEGRAM_BOT_TOKEN=your-token tsx scripts/configure-bot.ts');
  process.exit(1);
}

async function main() {
  try {
    console.log('🤖 Configuring bot as Setup Assistant...\n');
    
    // Get current bot info
    const botInfo = await getBotInfo(TELEGRAM_BOT_TOKEN);
    console.log(`Current bot: @${botInfo.username} (${botInfo.first_name})\n`);
    
    // Configure as Setup Assistant
    await configureSetupBot(TELEGRAM_BOT_TOKEN);
    
    // Verify changes
    const updatedInfo = await getBotInfo(TELEGRAM_BOT_TOKEN);
    console.log(`\n✅ Bot configured successfully!`);
    console.log(`   Name: ${updatedInfo.first_name}`);
    console.log(`   Username: @${updatedInfo.username}`);
    console.log(`\n   The bot is now set up as "Zaki - Setup Assistant"`);
    console.log(`   Users will see this name when they interact with the bot.`);
    
  } catch (error) {
    console.error('\n❌ Failed to configure bot:', error);
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
