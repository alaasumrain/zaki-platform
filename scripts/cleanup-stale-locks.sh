#!/bin/bash
# Cleanup stale OpenClaw session lock files
# Removes lock files from dead processes or files older than 30 minutes

set -e

LOCK_TIMEOUT_MINUTES=30
LOCK_TIMEOUT_MS=$((LOCK_TIMEOUT_MINUTES * 60 * 1000))

echo "🔍 Scanning for stale lock files..."

# Function to check if a process is alive
is_process_alive() {
    local pid=$1
    if [ -z "$pid" ] || [ "$pid" = "null" ]; then
        return 1
    fi
    ps -p "$pid" > /dev/null 2>&1
}

# Function to check if lock is stale
is_lock_stale() {
    local lock_file=$1
    if [ ! -f "$lock_file" ]; then
        return 1
    fi
    
    # Try to read the lock file
    local pid=$(jq -r '.pid' "$lock_file" 2>/dev/null || echo "")
    local created_at=$(jq -r '.createdAt' "$lock_file" 2>/dev/null || echo "")
    
    # If we can't parse it, consider it stale
    if [ -z "$pid" ] || [ -z "$created_at" ]; then
        return 0
    fi
    
    # Check if process is dead
    if ! is_process_alive "$pid"; then
        return 0
    fi
    
    # Check if lock is older than timeout
    local created_ms=$(date -d "$created_at" +%s 2>/dev/null || echo "0")
    local now_ms=$(date +%s)
    local age_seconds=$((now_ms - created_ms))
    local age_ms=$((age_seconds * 1000))
    
    if [ "$age_ms" -gt "$LOCK_TIMEOUT_MS" ]; then
        return 0
    fi
    
    return 1
}

# Clean locks in a directory
clean_locks_in_dir() {
    local dir=$1
    local cleaned=0
    
    if [ ! -d "$dir" ]; then
        return 0
    fi
    
    find "$dir" -type f -name "*.lock" | while read -r lock_file; do
        if is_lock_stale "$lock_file"; then
            echo "  🗑️  Removing stale lock: $lock_file"
            rm -f "$lock_file"
            cleaned=$((cleaned + 1))
        fi
    done
    
    return $cleaned
}

# Clean locks in containers
clean_container_locks() {
    echo "📦 Checking Docker containers..."
    docker ps --format "{{.Names}}" | grep "^zaki-user-" | while read -r container; do
        echo "  Checking container: $container"
        docker exec "$container" find /home/node/.openclaw -type f -name "*.lock" 2>/dev/null | while read -r lock_file; do
            # Get lock info from container
            local lock_info=$(docker exec "$container" cat "$lock_file" 2>/dev/null || echo "")
            if [ -z "$lock_info" ]; then
                echo "    🗑️  Removing unreadable lock: $lock_file"
                docker exec "$container" rm -f "$lock_file" 2>/dev/null || true
                continue
            fi
            
            local pid=$(echo "$lock_info" | jq -r '.pid' 2>/dev/null || echo "")
            local created_at=$(echo "$lock_info" | jq -r '.createdAt' 2>/dev/null || echo "")
            
            # Check if process is dead (inside container)
            if [ -n "$pid" ] && [ "$pid" != "null" ]; then
                if ! docker exec "$container" ps -p "$pid" > /dev/null 2>&1; then
                    echo "    🗑️  Removing lock from dead process (pid=$pid): $lock_file"
                    docker exec "$container" rm -f "$lock_file" 2>/dev/null || true
                fi
            else
                echo "    🗑️  Removing invalid lock: $lock_file"
                docker exec "$container" rm -f "$lock_file" 2>/dev/null || true
            fi
        done
    done
}

# Main cleanup
echo "🧹 Starting lock cleanup..."

# Clean host locks
if [ -d "/root/.openclaw" ]; then
    echo "📁 Cleaning host locks in /root/.openclaw..."
    clean_locks_in_dir "/root/.openclaw"
fi

# Clean user data locks
if [ -d "/var/zaki-platform/users" ]; then
    echo "📁 Cleaning user data locks..."
    find /var/zaki-platform/users -type d -name ".openclaw" | while read -r dir; do
        clean_locks_in_dir "$dir"
    done
fi

# Clean container locks
clean_container_locks

echo "✅ Lock cleanup complete!"
