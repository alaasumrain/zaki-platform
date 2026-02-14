/**
 * Bot Configuration Utilities
 * 
 * Manages bot name, description, and settings via Telegram Bot API
 */

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface BotDescription {
  description: string;
}

/**
 * Get bot information
 */
export async function getBotInfo(token: string): Promise<BotInfo> {
  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  if (!response.ok) {
    throw new Error(`Failed to get bot info: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

/**
 * Set bot name
 */
export async function setBotName(token: string, name: string): Promise<boolean> {
  const response = await fetch(`https://api.telegram.org/bot${token}/setMyName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set bot name: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

/**
 * Set bot description
 */
export async function setBotDescription(
  token: string,
  description: string,
  languageCode?: string
): Promise<boolean> {
  const response = await fetch(`https://api.telegram.org/bot${token}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description,
      language_code: languageCode,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set bot description: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

/**
 * Set bot short description (shown in chat list)
 */
export async function setBotShortDescription(
  token: string,
  shortDescription: string,
  languageCode?: string
): Promise<boolean> {
  const response = await fetch(`https://api.telegram.org/bot${token}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: shortDescription,
      language_code: languageCode,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to set bot short description: ${response.statusText}`);
  }
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
  return data.result;
}

/**
 * Configure bot for setup/onboarding role
 */
export async function configureSetupBot(token: string): Promise<void> {
  const name = 'Zaki - Setup Assistant';
  const shortDescription = 'Get your personal AI assistant set up in 2 minutes';
  const description = `Welcome! I'm Zaki Setup Assistant. I'll help you create your own private AI assistant.

Here's what I do:
• Guide you through setup (takes 2 minutes)
• Help you create your own Telegram bot
• Configure your personal AI instance
• Get you chatting with your private Zaki

Just send /start to begin! 🚀

After setup, you'll get your own private bot with full AI capabilities.`;

  try {
    // Set bot name
    await setBotName(token, name);
    console.log(`✅ Bot name set to: ${name}`);

    // Set short description (shown in chat list)
    await setBotShortDescription(token, shortDescription);
    console.log(`✅ Bot short description set`);

    // Set full description
    await setBotDescription(token, description);
    console.log(`✅ Bot description set`);

    console.log(`✅ Bot configured as Setup Assistant`);
  } catch (error) {
    console.error(`❌ Failed to configure bot:`, error);
    throw error;
  }
}
