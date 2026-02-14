# Cousin's Tasheel Instance - Complete Workflow

**Date:** 2026-02-09  
**Purpose:** How cousin uses his instance to fix errors and deploy

---

## 🎯 How It Works

### The Flow

```
Cousin Reports Error → Instance Understands → Finds Code → Fixes → Commits → Pushes → Vercel Deploys → Reports Back
```

---

## 📱 Step-by-Step Workflow

### 1. Cousin Reports Error

**Via Telegram:**
```
"There's a bug in the login form - it's not validating email addresses"
```

### 2. Instance Processes

The instance will:
1. **Understand** the error description
2. **Navigate** to `workspace/tasheel-platform/`
3. **Search** for login form code
4. **Find** the validation logic
5. **Identify** the bug
6. **Fix** the issue
7. **Test** (if possible)
8. **Commit** with message: "Fix: email validation in login form"
9. **Push** to GitHub main branch
10. **Report** back what was fixed

### 3. Vercel Auto-Deploys

- Vercel watches GitHub main branch
- Detects new commit
- Automatically builds and deploys
- Cousin gets updated site

### 4. Cousin Gets Response

```
✅ Fixed the email validation issue in src/app/login/page.tsx

The problem was missing email format validation. Added:
- Email regex pattern check
- Error message display
- Form validation before submit

Committed and pushed to GitHub. Vercel is deploying now.
```

---

## 🔧 Setup Steps

### Step 1: Create Instance with Tasheel Access

```bash
cd /root/zaki-platform
./scripts/setup-cousin-tasheel-instance.sh
```

This will:
- Create isolated instance
- Clone Tasheel repo into workspace
- Configure for error fixing
- Set up Git access

### Step 2: Configure Git Access

The instance needs GitHub access to push:

**Option A: Use GitHub CLI (if authenticated)**
```bash
# Instance will use gh CLI automatically
```

**Option B: Configure Git Credentials**
```bash
cd /root/clawd-user-{telegram-id}/tasheel-platform
git config user.name "Cousin Name"
git config user.email "cousin@email.com"

# For HTTPS (will prompt for token):
git remote set-url origin https://github.com/alaasumrain/tasheel-platform.git

# Or use SSH (if keys set up):
git remote set-url origin git@github.com:alaasumrain/tasheel-platform.git
```

**Option C: Use Personal Access Token**
```bash
# Store token in instance workspace (secure)
echo "ghp_your_token_here" > /root/clawd-user-{id}/.github-token
# Instance can read and use it
```

### Step 3: Configure Vercel (if needed)

**Option A: Auto-deploy from GitHub (Recommended)**
- Vercel watches GitHub repo
- Auto-deploys on push
- No extra config needed

**Option B: Vercel CLI in Instance**
```bash
# Install Vercel CLI in instance workspace
cd /root/clawd-user-{id}/tasheel-platform
npm install -g vercel

# Login (one time)
vercel login

# Link project
vercel link
```

---

## 💬 Example Conversations

### Example 1: Fix Login Bug

**Cousin:**
> "The login page crashes when I submit with an invalid email"

**Instance:**
1. Searches: `tasheel-platform/src/app/login/`
2. Finds: `page.tsx` and `actions/login.ts`
3. Identifies: Missing error handling
4. Fixes: Adds try-catch and validation
5. Commits: "Fix: login form error handling for invalid emails"
6. Pushes to GitHub
7. Reports: "Fixed the crash by adding proper error handling in the login action"

**Result:** Vercel deploys, bug fixed!

---

### Example 2: Add Feature

**Cousin:**
> "Add a loading spinner to the quote form submission"

**Instance:**
1. Finds: `src/app/quote/page.tsx`
2. Adds: Loading state and spinner component
3. Updates: Form submission handler
4. Commits: "Add: loading spinner to quote form"
5. Pushes and deploys

---

### Example 3: Fix Build Error

**Cousin:**
> "The build is failing with a TypeScript error in the services page"

**Instance:**
1. Runs: `cd tasheel-platform && npm run build`
2. Sees: TypeScript error details
3. Finds: Problematic file
4. Fixes: Type errors
5. Tests: `npm run build` again
6. Commits: "Fix: TypeScript errors in services page"
7. Pushes and deploys

---

## 🔐 Access Setup

### For Cousin to Use

1. **Telegram Bot Access:**
   - Cousin messages the main Zaki bot
   - Messages automatically route to his instance
   - No special setup needed

2. **GitHub Access:**
   - Instance needs write access to `alaasumrain/tasheel-platform`
   - Can use GitHub CLI token or SSH keys
   - Or add cousin as collaborator

3. **Vercel Access:**
   - Auto-deploys from GitHub (no config needed)
   - Or can use Vercel CLI in instance

---

## 🛠️ Advanced: Auto-Fix Configuration

### Enable Auto-Fix Mode

The instance can be configured to:
- Automatically fix errors without asking
- Run tests before committing
- Create PRs instead of direct push
- Deploy to staging first

**Configure in SOUL.md:**
```markdown
## Auto-Fix Mode
- Always fix errors automatically
- Run tests before committing
- Create PR for review (optional)
- Deploy to staging first (optional)
```

---

## 📊 Monitoring

### Check What Instance Did

```bash
# View recent commits
cd /root/clawd-user-{id}/tasheel-platform
git log --oneline -10

# Check if gateway is running
ps aux | grep "clawdbot gateway.*{port}"

# View instance logs
tail -f /tmp/clawdbot-user-{id}-gateway.log
```

### Check Vercel Deployment

- Vercel dashboard shows deployments
- Or check: `https://your-tasheel-app.vercel.app`

---

## ✅ Quick Start for Cousin

1. **Cousin sends `/start`** to Telegram bot
2. **Instance is created** automatically (with Tasheel repo)
3. **Cousin reports error:**
   > "Fix the navigation menu, it's not showing on mobile"
4. **Instance fixes it** and deploys
5. **Cousin gets confirmation** in Telegram

**That's it!** No manual Git, no manual deployment. Just describe the error and it gets fixed!

---

**Status:** Ready to set up! Run the script and cousin can start fixing errors! 🚀
