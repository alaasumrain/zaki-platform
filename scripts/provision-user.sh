#!/bin/bash
# provision-user.sh — Provision a new Zaki Hub user
# Usage: provision-user.sh <telegram_user_id> <display_name>
#
# Creates workspace, adds agent config, adds binding.
# Idempotent — safe to run multiple times for the same user.
set -euo pipefail

# ── Args ──────────────────────────────────────────────
if [ $# -lt 2 ]; then
  echo "Usage: $0 <telegram_user_id> <display_name>"
  exit 1
fi

USER_ID="$1"
DISPLAY_NAME="$2"

# ── Paths ─────────────────────────────────────────────
BASE_DIR="/data/users/zaki-hub"
STATE_DIR="$HOME/.clawdbot-zaki-hub"
USERS_DIR="$BASE_DIR/users"
SHARED_DIR="$BASE_DIR/shared"
CONFIG_USERS_DIR="$STATE_DIR/users"
AGENTS_FILE="$CONFIG_USERS_DIR/agents.json5"
BINDINGS_FILE="$CONFIG_USERS_DIR/bindings.json5"
USER_WORKSPACE="$USERS_DIR/$USER_ID"
AGENT_ID="user-$USER_ID"

# ── Idempotency check ────────────────────────────────
if [ -d "$USER_WORKSPACE" ]; then
  echo "✅ User $USER_ID already provisioned at $USER_WORKSPACE"
  exit 0
fi

echo "🔧 Provisioning user $USER_ID ($DISPLAY_NAME)..."

# ── 1. Create workspace ──────────────────────────────
mkdir -p "$USER_WORKSPACE/memory"

# Symlink shared files
ln -sf "$SHARED_DIR/SOUL.md" "$USER_WORKSPACE/SOUL.md"
ln -sf "$SHARED_DIR/AGENTS.md" "$USER_WORKSPACE/AGENTS.md"
ln -sf "$SHARED_DIR/TOOLS.md" "$USER_WORKSPACE/TOOLS.md"

# Create USER.md
cat > "$USER_WORKSPACE/USER.md" << EOF
# About You

**Name:** $DISPLAY_NAME
**Telegram ID:** $USER_ID
**Joined:** $(date +%Y-%m-%d)

*This will grow as Zaki learns about you.*
EOF

# Create MEMORY.md
cat > "$USER_WORKSPACE/MEMORY.md" << EOF
# Long-Term Memory

*Your personal memory space. Zaki will store important things here as you chat.*
EOF

# Create initial daily note
TODAY=$(date +%Y-%m-%d)
cat > "$USER_WORKSPACE/memory/$TODAY.md" << EOF
# $TODAY

## Onboarding
- $DISPLAY_NAME joined Zaki Hub
- Telegram ID: $USER_ID
EOF

# ── 2. Add agent to agents.json5 ─────────────────────
python3 -c "
import json, re

with open('$AGENTS_FILE') as f:
    content = f.read()

# Strip single-line JS comments and trailing commas for JSON compat
clean = re.sub(r'//.*?\n', '\n', content)
clean = re.sub(r',(\s*[}\]])', r'\1', clean)
agents = json.loads(clean)

# Check if agent already exists
if any(a.get('id') == '$AGENT_ID' for a in agents):
    print('Agent $AGENT_ID already in agents.json5')
else:
    new_agent = {
        'id': '$AGENT_ID',
        'name': 'Zaki for $DISPLAY_NAME',
        'workspace': '$USER_WORKSPACE',
        'tools': {
            'deny': ['gateway']
        }
    }
    # Insert before the last entry (onboarding fallback stays last)
    agents.insert(len(agents) - 1, new_agent)
    with open('$AGENTS_FILE', 'w') as f:
        json.dump(agents, f, indent=2, ensure_ascii=False)
    print('Added agent $AGENT_ID to agents.json5')
"

# ── 3. Add binding to bindings.json5 ─────────────────
python3 -c "
import json, re

with open('$BINDINGS_FILE') as f:
    content = f.read()

clean = re.sub(r'//.*?\n', '\n', content)
clean = re.sub(r',(\s*[}\]])', r'\1', clean)
bindings = json.loads(clean)

# Check if binding already exists
if any(b.get('agentId') == '$AGENT_ID' for b in bindings):
    print('Binding for $AGENT_ID already in bindings.json5')
else:
    new_binding = {
        'agentId': '$AGENT_ID',
        'match': {
            'channel': 'telegram',
            'peer': {'kind': 'dm', 'id': '$USER_ID'}
        }
    }
    # Insert before the last entry (fallback stays last)
    bindings.insert(len(bindings) - 1, new_binding)
    with open('$BINDINGS_FILE', 'w') as f:
        json.dump(bindings, f, indent=2, ensure_ascii=False)
    print('Added binding for $AGENT_ID to bindings.json5')
"

# ── 4. Touch main config to trigger hot reload ───────
touch "$STATE_DIR/clawdbot.json"

echo "✅ User $USER_ID ($DISPLAY_NAME) provisioned successfully"
echo "   Workspace: $USER_WORKSPACE"
echo "   Agent ID:  $AGENT_ID"

# ── 5. Notify admin via Telegram ──────────────────────
ADMIN_CHAT_ID="1538298785"
BOT_TOKEN="8284734718:AAF_LQsYjJRFZdvjFo_5EuFF1nWuI3vOlAY"
NOTIFY_MSG="🆕 <b>New Zaki User Provisioned</b>

👤 <b>Name:</b> $DISPLAY_NAME
🆔 <b>Telegram ID:</b> <code>$USER_ID</code>
📅 <b>Joined:</b> $(date '+%Y-%m-%d %H:%M')
🤖 <b>Agent:</b> $AGENT_ID
📁 <b>Workspace:</b> <code>$USER_WORKSPACE</code>

📊 Total users: $(ls -d /data/users/zaki-hub/users/*/ 2>/dev/null | wc -l)"

curl -s "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d "chat_id=${ADMIN_CHAT_ID}" \
  -d "text=${NOTIFY_MSG}" \
  -d "parse_mode=HTML" > /dev/null 2>&1 || true
