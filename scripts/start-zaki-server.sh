#!/bin/bash
# Start Zaki Platform VM-based server

set -e

echo "🚀 Starting Zaki Platform Server"
echo "=================================="
echo ""

# Load environment variables from .env.local if it exists
if [ -f "/root/zaki-platform/.env.local" ]; then
    source /root/zaki-platform/.env.local
    echo "✅ Loaded environment from .env.local"
fi

# Check environment variables
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "⚠️  Warning: TELEGRAM_BOT_TOKEN not set"
    echo "   Set it with: export TELEGRAM_BOT_TOKEN=your-token"
    echo "   Or add it to /root/zaki-platform/.env.local"
    exit 1
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set"
    echo "   Set it with: export ANTHROPIC_API_KEY=your-key"
fi

# Set defaults
export PORT=${PORT:-3000}
export NODE_ENV=${NODE_ENV:-production}
export GATEWAY_TOKEN=${GATEWAY_TOKEN:-zaki-internal-token}

# Create necessary directories
mkdir -p /root/zaki-platform/data/users
mkdir -p /tmp/zaki-onboarding

# Check if already running
if pgrep -f "node.*src/index.ts\|tsx.*src/index.ts" > /dev/null 2>&1; then
    echo "✅ Zaki Platform server is already running"
    echo "   PID: $(pgrep -f 'node.*src/index.ts\|tsx.*src/index.ts')"
    exit 0
fi

# Check if tsx is available (for dev mode)
if command -v tsx > /dev/null 2>&1; then
    echo "📦 Starting in development mode (tsx watch)..."
    echo "   Port: $PORT"
    echo "   Logs: /tmp/zaki-server.log"
    echo ""
    
    cd /root/zaki-platform
    nohup tsx watch src/index.ts > /tmp/zaki-server.log 2>&1 &
    SERVER_PID=$!
    
    echo "✅ Server started!"
    echo "   PID: $SERVER_PID"
    echo "   Logs: tail -f /tmp/zaki-server.log"
    echo ""
    echo "🌐 Server running at: http://localhost:$PORT"
    echo "📱 Telegram webhook: http://$(hostname -I | awk '{print $1}'):$PORT/telegram/webhook"
elif command -v node > /dev/null 2>&1; then
    echo "📦 Building and starting in production mode..."
    
    cd /root/zaki-platform
    npm run build
    
    echo "✅ Server starting..."
    nohup node dist/index.js > /tmp/zaki-server.log 2>&1 &
    SERVER_PID=$!
    
    echo "   PID: $SERVER_PID"
    echo "   Logs: tail -f /tmp/zaki-server.log"
else
    echo "❌ Error: Neither tsx nor node found"
    exit 1
fi

echo ""
echo "📝 To stop: kill $SERVER_PID"
echo "📝 To view logs: tail -f /tmp/zaki-server.log"
