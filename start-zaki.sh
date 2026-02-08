#!/bin/bash
# Zaki Platform - OpenClaw Startup Script
# Runs inside each user's Sandbox

set -e

# Source env file if it exists (workaround for Sandbox SDK env passing issues)
if [ -f /tmp/zaki-env.sh ]; then
  echo "[Zaki] Loading env from /tmp/zaki-env.sh"
  source /tmp/zaki-env.sh
fi

GATEWAY_PORT="${GATEWAY_PORT:-18789}"
GATEWAY_TOKEN="${GATEWAY_TOKEN:-zaki-internal-token}"
CLAWD_DIR="/root/clawd"
USER_NAME="${USER_NAME:-User}"
USER_LANGUAGE="${USER_LANGUAGE:-en}"
USER_STYLE="${USER_STYLE:-casual}"
USER_PURPOSE="${USER_PURPOSE:-everything}"
USER_INTERESTS="${USER_INTERESTS:-}"

echo "[Zaki] Starting OpenClaw for user: ${USER_NAME} (lang: ${USER_LANGUAGE})"
echo "[Zaki] GOOGLE_API_KEY set: $([ -n "$GOOGLE_API_KEY" ] && echo YES || echo NO)"
echo "[Zaki] ANTHROPIC_API_KEY set: $([ -n "$ANTHROPIC_API_KEY" ] && echo YES || echo NO)"

# Create workspace if not exists
mkdir -p "$CLAWD_DIR/skills"
mkdir -p "$CLAWD_DIR/memory"

# Create SOUL.md from env vars (customized per user)
STYLE_INSTRUCTION=""
case "$USER_STYLE" in
  adaptive) STYLE_INSTRUCTION="Adapt your tone to the context. Be casual in chat, professional for work, concise for quick questions." ;;
  casual)   STYLE_INSTRUCTION="Be casual, fun, and use humor when appropriate. Use emoji freely." ;;
  professional) STYLE_INSTRUCTION="Be professional and polished. Keep responses well-structured." ;;
  direct)   STYLE_INSTRUCTION="Be extremely concise. No fluff. Get straight to the answer." ;;
  *)        STYLE_INSTRUCTION="Be helpful and conversational." ;;
esac

LANG_INSTRUCTION=""
case "$USER_LANGUAGE" in
  ar) LANG_INSTRUCTION="Always respond in Arabic (عربي). The user prefers Arabic." ;;
  de) LANG_INSTRUCTION="Always respond in German (Deutsch). The user prefers German." ;;
  fr) LANG_INSTRUCTION="Always respond in French (Français). The user prefers French." ;;
  es) LANG_INSTRUCTION="Always respond in Spanish (Español). The user prefers Spanish." ;;
  tr) LANG_INSTRUCTION="Always respond in Turkish (Türkçe). The user prefers Turkish." ;;
  *)  LANG_INSTRUCTION="" ;;
esac

cat > "$CLAWD_DIR/SOUL.md" << EOF
# Zaki - Personal AI Assistant

## Who You Are
You are **Zaki**, ${USER_NAME}'s personal AI assistant.

## Your Style
${STYLE_INSTRUCTION}

## Focus Area
The user mainly needs help with ${USER_PURPOSE}. Prioritize this in your responses.

${LANG_INSTRUCTION:+## Language
$LANG_INSTRUCTION}

## Core Principles
- Be genuinely helpful, not generic
- Remember context from previous conversations
- Be honest about your limitations
- Respect the user's time
EOF

# Create USER.md
cat > "$CLAWD_DIR/USER.md" << EOF
# About the User
- **Name:** ${USER_NAME}
- **Telegram ID:** ${USER_TELEGRAM_ID:-unknown}
- **Language:** ${USER_LANGUAGE}
- **Style:** ${USER_STYLE}
- **Interests:** ${USER_INTERESTS:-Not specified}
EOF

# Create IDENTITY.md
cat > "$CLAWD_DIR/IDENTITY.md" << 'EOF'
# Zaki
- **Name:** Zaki
- **Role:** Personal AI Assistant
- **Vibe:** Friendly, helpful, gets stuff done
- **Emoji:** 🤖
EOF

# Create AGENTS.md
cat > "$CLAWD_DIR/AGENTS.md" << 'EOF'
# Agent Instructions

You are Zaki, a personal AI assistant. Be helpful, stay in character,
and use your tools when needed (web search, file operations, etc.)
EOF

# Create OpenClaw config (JSON format - the actual config format)
mkdir -p /root/.openclaw

# Determine model (API keys come from environment variables, not config)
if [ -n "$GOOGLE_API_KEY" ]; then
  MODEL="${DEFAULT_MODEL:-google/gemini-3-flash-preview}"
elif [ -n "$ANTHROPIC_API_KEY" ]; then
  MODEL="${DEFAULT_MODEL:-anthropic/claude-sonnet-4-20250514}"
else
  echo "[Zaki] ERROR: No API key found!"
  exit 1
fi

# Write config to both possible config directories
mkdir -p /root/.clawdbot
mkdir -p /root/.openclaw
cat > /root/.clawdbot/clawdbot.json << EOF
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "${MODEL}"
      },
      "workspace": "${CLAWD_DIR}",
      "heartbeat": {
        "every": "0m"
      }
    }
  },
  "gateway": {
    "port": ${GATEWAY_PORT},
    "mode": "local",
    "bind": "loopback",
    "auth": {
      "mode": "token",
      "token": "${GATEWAY_TOKEN}"
    },
    "http": {
      "endpoints": {
        "chatCompletions": {
          "enabled": true
        }
      }
    }
  }
}
EOF

# Copy to all possible config locations
cp /root/.clawdbot/clawdbot.json /root/.clawdbot/openclaw.json
cp /root/.clawdbot/clawdbot.json /root/.openclaw/clawdbot.json
cp /root/.clawdbot/clawdbot.json /root/.openclaw/openclaw.json

echo "[Zaki] Config written. Starting gateway on port ${GATEWAY_PORT}..."
echo "[Zaki] Model: ${MODEL}"
echo "[Zaki] Chat completions endpoint: enabled"

# Start OpenClaw gateway
cd "$CLAWD_DIR"
exec clawdbot gateway --port "$GATEWAY_PORT" --allow-unconfigured
# Updated: 1770217255
