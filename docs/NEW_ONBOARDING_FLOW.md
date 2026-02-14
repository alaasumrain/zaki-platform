# New Onboarding Flow - User-Owned Bots

## Overview

Each user now gets their own Telegram bot token, enabling:
- ✅ Full OpenClaw capabilities (proactive messaging, heartbeat, cron)
- ✅ Complete privacy (user owns the token)
- ✅ No routing layer needed
- ✅ Native OpenClaw design

## Architecture Change

### Before (Shared Bot)
```
@zakified_bot → Router → Containers (Telegram disabled)
```
- Router sees all messages
- No proactive messaging
- Limited privacy

### After (User-Owned Bots)
```
User's Bot → Container (Telegram enabled with user's token)
```
- Direct connection
- Full proactive capabilities
- Complete privacy

## Onboarding Flow

### New Users

1. **Language Selection** - Choose preferred language
2. **Name** - Enter name
3. **Purpose** - Select main use case
4. **Style** - Choose communication style
5. **Interests** - Optional interests/hobbies
6. **API Keys** (Optional) - Add own API keys or use shared
7. **Bot Token** (NEW) - Create bot via BotFather and paste token
8. **Complete** - Instance created with user's bot token

### Legacy Users (Upgrade)

When a legacy user (has instance but no bot token) messages @zakified_bot:
- They get an upgrade prompt
- Guided through bot creation
- Their instance is reconfigured with the new bot token
- Redirected to their new bot

## Implementation Details

### Onboarding State

Added to `OnboardingState`:
```typescript
botToken?: string;
botUsername?: string;
```

### Instance Manager

Updated `createUserInstance` to accept:
```typescript
telegramBotToken?: string;
```

Config now includes:
```json
{
  "telegram": {
    "enabled": true,
    "botToken": "user_provided_token"
  }
}
```

### Bot Token Validation

- Format validation: `^\d{8,11}:[A-Za-z0-9_-]{35}$`
- Telegram API validation: Calls `getMe` to verify token
- Extracts bot username for redirect link

## User Experience

### New User Journey

1. Message @zakified_bot → `/start`
2. Complete onboarding steps
3. Get guided to create bot via BotFather
4. Paste token
5. Receive link to their bot: `t.me/their_bot`
6. Chat directly with their private bot

### Legacy User Upgrade

1. Message @zakified_bot
2. See upgrade prompt
3. Create bot via BotFather
4. Paste token
5. Instance reconfigured
6. Redirected to new bot

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| Privacy | Router sees all | User owns token |
| Proactive | ❌ Not possible | ✅ Full support |
| Heartbeat | ❌ Not possible | ✅ Full support |
| Cron | ❌ Not possible | ✅ Full support |
| Routing | Required | Not needed |
| Complexity | High | Low |

## Migration Notes

- Legacy users are automatically offered upgrade
- Old instances can coexist with new ones
- No data loss during migration
- User can skip bot creation (uses shared mode, less private)

## Testing

To test the new flow:

1. Message @zakified_bot with `/start`
2. Complete onboarding
3. When prompted, create a bot via @BotFather
4. Paste the token
5. Verify instance is created with bot token
6. Click link to your bot
7. Chat with your private bot

## Files Modified

- `src/onboarding.ts` - Added bot_token step and translations
- `src/index.ts` - Bot token collection, validation, legacy upgrade
- `src/services/instance-manager.ts` - Accept and configure bot token
