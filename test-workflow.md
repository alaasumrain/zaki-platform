# Workflow Test Plan

## Current Flow (After Updates)

1. **User sends `/start` to @zakified_bot**
   - ✅ Resets onboarding state
   - ✅ Shows language selection (English/Arabic)

2. **User selects language**
   - ✅ Sets `state.language`
   - ✅ Moves to `state.step = 'bot_token'` (NEW - bot token first!)

3. **User sees bot token prompt**
   - ✅ Shows "Just paste your bot token here"
   - ✅ Buttons: Open BotFather, Help, Skip
   - ✅ NO broken "Secure Setup" button

4. **User pastes bot token**
   - ✅ Validates format: `^\d{8,11}:[A-Za-z0-9_-]{35}$`
   - ✅ Validates with Telegram API (`getMe`)
   - ✅ Saves `state.botToken` and `state.botUsername`

5. **Instance creation**
   - ✅ Creates container with bot token
   - ✅ Configures OpenClaw with their bot
   - ✅ Redirects to their bot

6. **User goes to their bot**
   - ⚠️ Onboarding continues there (name, purpose, style)
   - ⚠️ Or they can start using it immediately

---

## Test Checklist

- [ ] Server is running
- [ ] Bot is polling
- [ ] Language selection works
- [ ] Bot token prompt appears immediately after language
- [ ] Token validation works
- [ ] Instance creation works
- [ ] Redirect message is sent

---

## Manual Test Steps

1. Open Telegram
2. Message `@zakified_bot`
3. Send `/start`
4. Select language (English or Arabic)
5. Should immediately see bot token prompt
6. Paste a valid bot token
7. Should see "Bot token validated!" message
8. Should see "Starting up your private AI instance..."
9. Should get redirect message to their bot

---

## Expected Behavior

✅ **Language → Bot Token (immediate)**
✅ **No broken links**
✅ **Token validated before instance creation**
✅ **Instance created with bot token**
✅ **User redirected to their bot**

---

**Status:** Ready to test! 🧪
