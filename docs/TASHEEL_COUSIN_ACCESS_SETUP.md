# Tasheel Platform - Cousin Full Access Setup

**Date:** 2026-02-09  
**Purpose:** Set up full access for cousin to Tasheel platform

---

## 🎯 What We're Setting Up

Your cousin will have full access to:
1. ✅ **Telegram Bot** - Direct access to manage and configure
2. ✅ **GitHub Repository** - Full repo access (read/write)
3. ✅ **Supabase** - Database and backend access
4. ✅ **OpenClaw Dashboard** - Gateway and channel management
5. ✅ **Development Environment** - Local setup for making changes

---

## 📋 Access Checklist

### 1. Telegram Bot Access

**Steps:**
1. Create a new Telegram bot for Tasheel (or use existing)
2. Get bot token from [@BotFather](https://t.me/BotFather)
3. Configure bot in OpenClaw dashboard
4. Give cousin access to bot token and dashboard

**Bot Token Format:**
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Configuration:**
- Bot Name: `TasheelBot` (or your choice)
- Username: `@tasheel_bot` (or your choice)
- Description: "Tasheel Platform Assistant"

---

### 2. GitHub Repository Access

**Option A: Add as Collaborator (Recommended)**
```bash
# On GitHub:
# 1. Go to repository settings
# 2. Click "Collaborators"
# 3. Add cousin's GitHub username
# 4. Grant "Write" or "Admin" access
```

**Option B: Create Organization Team**
```bash
# If using GitHub Organization:
# 1. Create "Tasheel Team"
# 2. Add cousin to team
# 3. Grant team access to repository
```

**Repository Structure:**
```
tasheel-platform/
├── frontend/          # React/Next.js app
├── backend/          # API server
├── telegram-bot/     # Bot configuration
├── supabase/         # Database migrations
└── docs/             # Documentation
```

**Access Level:**
- ✅ Read/Write code
- ✅ Create branches
- ✅ Open/merge PRs
- ✅ Manage issues
- ✅ Deploy to staging

---

### 3. Supabase Access

**Steps:**
1. Go to Supabase Dashboard
2. Open your Tasheel project
3. Go to "Settings" → "Team"
4. Invite cousin by email
5. Grant "Admin" or "Developer" role

**What Cousin Can Access:**
- ✅ Database tables (read/write)
- ✅ API keys (read)
- ✅ Auth users management
- ✅ Storage buckets
- ✅ Edge Functions
- ✅ Database migrations

**Supabase Credentials:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Security Note:**
- Share `ANON_KEY` for frontend
- Keep `SERVICE_ROLE_KEY` secret (backend only)
- Use Row Level Security (RLS) policies

---

### 4. OpenClaw Dashboard Access

**Steps:**
1. Create cousin's user account in dashboard
2. Grant admin permissions
3. Share dashboard URL and credentials

**Dashboard URL:**
```
http://62.171.148.105:18791
# or your domain
```

**Access Features:**
- ✅ Gateway management (start/stop/restart)
- ✅ Channel configuration (Telegram, etc.)
- ✅ Model settings
- ✅ Chat sessions
- ✅ System logs

---

### 5. Development Environment Setup

**Local Setup for Cousin:**

```bash
# 1. Clone repository
git clone https://github.com/your-org/tasheel-platform.git
cd tasheel-platform

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Add credentials to .env.local
TELEGRAM_BOT_TOKEN=your-bot-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENCLAW_GATEWAY_URL=http://localhost:19001

# 5. Run development server
npm run dev
```

---

## 🔐 Credentials to Share

### Telegram Bot
- **Bot Token:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
- **Bot Username:** `@tasheel_bot`
- **Dashboard URL:** `http://62.171.148.105:18791`

### Supabase
- **Project URL:** `https://your-project.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Dashboard:** `https://app.supabase.com/project/your-project`

### GitHub
- **Repository:** `https://github.com/your-org/tasheel-platform`
- **Access:** Collaborator (Write)

### OpenClaw
- **Gateway URL:** `http://localhost:19001` (local)
- **Gateway URL:** `http://62.171.148.105:19001` (remote)
- **Dashboard:** `http://62.171.148.105:18791`

---

## 🚀 Quick Start Script

Create a setup script for your cousin:

```bash
#!/bin/bash
# tasheel-setup.sh

echo "🚀 Setting up Tasheel Platform for Development..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node.js 18+"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not found. Install Git"; exit 1; }

# Clone repository
echo "📦 Cloning repository..."
git clone https://github.com/your-org/tasheel-platform.git
cd tasheel-platform

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Create .env.local
echo "⚙️  Setting up environment..."
cat > .env.local << EOF
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token-here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# OpenClaw
OPENCLAW_GATEWAY_URL=http://localhost:19001

# Development
NODE_ENV=development
PORT=3000
EOF

echo "✅ Setup complete!"
echo "📝 Next steps:"
echo "   1. Edit .env.local with your credentials"
echo "   2. Run: npm run dev"
echo "   3. Open: http://localhost:3000"
```

---

## 📱 Telegram Bot Configuration

### Step 1: Create Bot with BotFather

```
1. Open Telegram
2. Search for @BotFather
3. Send: /newbot
4. Follow prompts to create bot
5. Save the bot token
```

### Step 2: Configure in OpenClaw Dashboard

1. Go to Dashboard → Settings → Channels
2. Click "Add Channel" → Select "Telegram"
3. Enter bot token
4. Set DM Policy (Open/Paired/Closed)
5. Test connection
6. Sync to Gateway

### Step 3: Set Webhook (Optional)

For production, set webhook URL:
```
https://your-domain.com/webhook/telegram
```

---

## 🗄️ Supabase Setup

### Database Schema

Create initial tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  username TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  channel TEXT, -- 'telegram', 'web', etc.
  content TEXT,
  role TEXT, -- 'user', 'assistant'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### API Keys

**Anon Key (Public):**
- Use in frontend
- Limited by RLS policies
- Safe to expose

**Service Role Key (Secret):**
- Use in backend only
- Bypasses RLS
- Keep secure!

---

## 🔧 Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
npm run dev

# 4. Commit changes
git add .
git commit -m "Add new feature"

# 5. Push to GitHub
git push origin feature/new-feature

# 6. Create Pull Request on GitHub
```

### Database Changes

```bash
# 1. Create migration
supabase migration new add_new_table

# 2. Edit migration file
# ... add SQL ...

# 3. Apply migration locally
supabase db reset

# 4. Test migration
# ... test ...

# 5. Commit migration
git add supabase/migrations/
git commit -m "Add new table migration"
```

---

## 📞 Support & Communication

### Channels
- **Telegram:** Direct message or group
- **GitHub Issues:** For bugs/features
- **GitHub Discussions:** For questions
- **Email:** For sensitive matters

### Documentation
- **README.md:** Project overview
- **docs/:** Detailed documentation
- **API docs:** Supabase API reference

---

## 🛡️ Security Best Practices

### Credentials
- ✅ Never commit `.env` files
- ✅ Use `.env.local` for local development
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/staging/prod

### Code
- ✅ Review PRs before merging
- ✅ Run tests before deploying
- ✅ Use linting and formatting
- ✅ Follow security guidelines

### Database
- ✅ Use RLS policies
- ✅ Validate inputs
- ✅ Sanitize user data
- ✅ Regular backups

---

## ✅ Setup Verification

### Checklist for Cousin

- [ ] GitHub access granted and tested
- [ ] Repository cloned locally
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Telegram bot token received
- [ ] Supabase access granted
- [ ] Dashboard access working
- [ ] Local dev server running
- [ ] Can make and push changes
- [ ] Can access database
- [ ] Can configure Telegram bot

---

## 🚨 Troubleshooting

### Common Issues

**1. Can't clone repository**
- Check GitHub access
- Verify SSH keys or HTTPS credentials

**2. Telegram bot not responding**
- Verify bot token
- Check gateway is running
- Check webhook URL (if using)

**3. Supabase connection failed**
- Verify URL and keys
- Check network access
- Verify RLS policies

**4. Dashboard not accessible**
- Check server is running
- Verify port is open
- Check firewall settings

---

## 📚 Next Steps

1. **Share this document** with your cousin
2. **Create Telegram bot** and share token
3. **Add to GitHub** as collaborator
4. **Invite to Supabase** project
5. **Share dashboard** credentials
6. **Help with initial setup** if needed

---

**Status:** Ready to set up! 🚀

**Contact:** If you need help, reach out via Telegram or GitHub Issues.
