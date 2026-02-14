# Recommended Skills for Cousin's Tasheel Instance

**Date:** 2026-02-09  
**Purpose:** Skills that would be useful for Tasheel Platform development

---

## 🎯 Top Skills for Development

### 1. **Git Operations** ⭐⭐⭐
**Why:** Essential for committing fixes and pushing to GitHub
- Commit changes
- Push to remote
- Create branches
- Handle merge conflicts
- View git history

**Install:** Browse ClawHub for "git" or "version-control" skills

---

### 2. **Code Review** ⭐⭐⭐
**Why:** Automatically review code for bugs before committing
- Find potential bugs
- Suggest improvements
- Check code quality
- Identify security issues

**Install:** Look for "code-review" or "lint" skills

---

### 3. **Error Fixer** ⭐⭐⭐
**Why:** Automatically fix common errors (TypeScript, build errors, etc.)
- Fix TypeScript errors
- Fix import issues
- Fix syntax errors
- Fix build errors

**Install:** Search for "error-fixer" or "bug-fix" skills

---

### 4. **TypeScript Helper** ⭐⭐
**Why:** Tasheel uses TypeScript - helpful for type fixes
- Fix type errors
- Add missing types
- Improve type safety
- Generate type definitions

**Install:** Search for "typescript" skills

---

### 5. **Next.js Helper** ⭐⭐
**Why:** Tasheel is built with Next.js
- Next.js specific fixes
- App router helpers
- Server component helpers
- Route generation

**Install:** Search for "nextjs" or "next.js" skills

---

### 6. **Supabase Helper** ⭐⭐
**Why:** Tasheel uses Supabase for database
- Query optimization
- Database operations
- Schema management
- Migration helpers

**Install:** Search for "supabase" or "database" skills

---

### 7. **Vercel Deploy** ⭐
**Why:** Automated deployment (though Vercel auto-deploys from GitHub)
- Manual deployment if needed
- Deployment status checks
- Environment variable management

**Install:** Search for "vercel" or "deploy" skills

---

### 8. **File Manager** ⭐
**Why:** Navigate and manage files in workspace
- File navigation
- File operations
- Directory management
- File search

**Install:** Search for "file" or "filesystem" skills

---

### 9. **Code Generator** ⭐
**Why:** Generate boilerplate code quickly
- Component generation
- API route generation
- Type definitions
- Test files

**Install:** Search for "generator" or "scaffold" skills

---

### 10. **Test Writer** ⭐
**Why:** Write tests for code changes
- Unit test generation
- Integration test helpers
- Test coverage analysis

**Install:** Search for "test" or "testing" skills

---

## 🔍 How to Find Skills

### Option 1: Browse ClawHub Website
1. Go to: **https://clawhub.ai**
2. Search for keywords: "git", "code", "typescript", "nextjs", etc.
3. Click on skills to see details
4. Install using ClawHub CLI or manually

### Option 2: Use ClawHub CLI
```bash
# Install ClawHub CLI (if not installed)
npm install -g clawhub

# Search for skills
clawhub search git
clawhub search typescript
clawhub search code-review

# Install a skill
clawhub sync <skill-name>
```

### Option 3: Manual Installation
1. Browse https://clawhub.ai
2. Find skill you want
3. Download `SKILL.md` and supporting files
4. Place in: `/root/clawd-user-{telegram-id}/skills/`

---

## 🚀 Quick Setup

```bash
# Run the setup script
cd /root/zaki-platform
./scripts/setup-cousin-skills.sh

# Enter cousin's Telegram ID
# Script creates skills directory and index
```

---

## 📝 Skills Directory Structure

```
/root/clawd-user-{telegram-id}/
└── skills/
    ├── README.md (index)
    ├── git-operations/
    │   └── SKILL.md
    ├── code-review/
    │   └── SKILL.md
    └── ...
```

---

## ✅ Priority Order

**Must Have:**
1. Git Operations
2. Error Fixer
3. Code Review

**Nice to Have:**
4. TypeScript Helper
5. Next.js Helper
6. Supabase Helper

**Optional:**
7. File Manager
8. Code Generator
9. Test Writer
10. Vercel Deploy

---

## 🎯 For Cousin's Use Case

**Best Combo:**
- Git Operations (commit/push fixes)
- Error Fixer (auto-fix bugs)
- Code Review (quality check)

With these 3, cousin can:
1. Report error
2. Instance fixes it (Error Fixer)
3. Reviews the fix (Code Review)
4. Commits and pushes (Git Operations)
5. Vercel auto-deploys

**Perfect workflow!** 🚀

---

**Status:** Ready to install skills! Browse ClawHub and pick what you need!
