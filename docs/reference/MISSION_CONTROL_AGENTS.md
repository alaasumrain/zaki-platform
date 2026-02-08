# Mission Control: Multi-Agent OpenClaw System

Source: @pbteja1998 (SiteGPT) - Complete guide to building AI agent squads
Date: Jan 31, 2026

## Overview

10 AI agents working as a team using OpenClaw. Each agent = separate OpenClaw session with unique identity, memory, and cron schedule.

## The Insight

> "Ten agents = ten sessions. Each waking up on their own schedule. Each with their own context."

OpenClaw sessions are independent. Each can have:
- Own personality (SOUL.md)
- Own memory files
- Own cron schedule
- Own tools and access

## Architecture

```
User → Telegram → Jarvis (Squad Lead)
                      ↓
              Mission Control (Convex DB)
                      ↓
    ┌─────┬─────┬─────┬─────┬─────┐
    Shuri Fury  Vision Loki  Quill ...
    (each a separate OpenClaw session)
```

## The Squad (10 Agents)

| Agent | Role | Session Key |
|-------|------|-------------|
| Jarvis | Squad Lead | agent:main:main |
| Shuri | Product Analyst | agent:product-analyst:main |
| Fury | Customer Researcher | agent:customer-researcher:main |
| Vision | SEO Analyst | agent:seo-analyst:main |
| Loki | Content Writer | agent:content-writer:main |
| Quill | Social Media | agent:social-media-manager:main |
| Wanda | Designer | agent:designer:main |
| Pepper | Email Marketing | agent:email-marketing:main |
| Friday | Developer | agent:developer:main |
| Wong | Documentation | agent:notion-agent:main |

## Heartbeat System

Agents wake every 15 minutes via cron (staggered):

```
:00 Pepper wakes → checks for work → HEARTBEAT_OK or does task
:02 Shuri wakes
:04 Friday wakes
:06 Loki wakes
...
```

### Cron Setup

```bash
clawdbot cron add \
  --name "pepper-mission-control-check" \
  --cron "0,15,30,45 * * * *" \
  --session "isolated" \
  --message "You are Pepper, the Email Marketing Specialist. Check Mission Control for new tasks..."
```

### Why 15 Minutes?

- 5 min = too expensive (agents wake with nothing to do)
- 30 min = too slow (work sits waiting)
- 15 min = good balance

## Memory Stack

### 1. Session Memory (Built-in)
Conversation history in JSONL files.

### 2. Working Memory (`/memory/WORKING.md`)
```markdown
# WORKING.md

## Current Task
Researching competitor pricing for comparison page

## Status
Gathered G2 reviews, need to verify credit calculations

## Next Steps
1. Test competitor free tier myself
2. Document findings
3. Post to task thread
```

### 3. Daily Notes (`/memory/YYYY-MM-DD.md`)
Raw logs of what happened each day.

### 4. Long-term Memory (`MEMORY.md`)
Curated important stuff. Lessons, decisions, stable facts.

### Golden Rule
> "If you want to remember something, write it to a file."

## SOUL System (Agent Personalities)

```markdown
# SOUL.md — Who You Are

Name: Shuri
Role: Product Analyst

## Personality
Skeptical tester. Thorough bug hunter. Finds edge cases.
Think like a first-time user. Question everything.

## What You're Good At
- Testing features from user perspective
- Finding UX issues and edge cases
- Competitive analysis
- Screenshots and documentation

## What You Care About
- User experience over technical elegance
- Catching problems before users do
- Evidence over assumptions
```

## Mission Control (Shared Brain)

### Why Convex?
- Real-time (changes propagate instantly)
- Serverless
- TypeScript-native
- Generous free tier

### Schema (6 Tables)

```javascript
agents: { name, role, status, currentTaskId, sessionKey }
tasks: { title, description, status, assigneeIds }
messages: { taskId, fromAgentId, content, attachments }
activities: { type, agentId, message }
documents: { title, content, type, taskId }
notifications: { mentionedAgentId, content, delivered }
```

### Task Lifecycle

```
Inbox → Assigned → In Progress → Review → Done
                                    ↑
                                 Blocked
```

## Notification System

### @Mentions
Type `@Vision` → Vision gets notified on next heartbeat.
Type `@all` → Everyone gets notified.

### Thread Subscriptions
- Comment on task → subscribed
- Get @mentioned → subscribed
- Get assigned → subscribed
- Once subscribed → notified of ALL future comments

### Delivery Daemon
```javascript
while (true) {
  const undelivered = await getUndeliveredNotifications();
  for (const notification of undelivered) {
    const sessionKey = AGENT_SESSIONS[notification.mentionedAgentId];
    try {
      await clawdbot.sessions.send(sessionKey, notification.content);
      await markDelivered(notification.id);
    } catch (e) {
      // Agent asleep, stays queued
    }
  }
  await sleep(2000);
}
```

## Daily Standup

Cron fires at 11:30 PM daily:

```markdown
📊 DAILY STANDUP — Jan 30, 2026

✅ COMPLETED TODAY
• Loki: Shopify blog post (2,100 words)
• Quill: 10 tweets drafted for approval

🔄 IN PROGRESS
• Vision: SEO strategy for integration pages
• Pepper: Trial onboarding sequence (3/5 emails)

🚫 BLOCKED
• Wanda: Waiting for brand colors

👀 NEEDS REVIEW
• Loki's Shopify blog post
```

## Lessons Learned

1. **Start smaller** - 2-3 agents first, then scale
2. **Cheaper models for routine** - Heartbeats don't need Opus
3. **Memory is hard** - Put everything in files, not "mental notes"
4. **Let agents surprise you** - They contribute to unassigned tasks

## For Zaki Platform

### Tier Ideas

| Tier | Agents | Price |
|------|--------|-------|
| Basic | 1 (personal assistant) | $15-20/mo |
| Pro | 3 (assistant + 2 specialists) | $40-50/mo |
| Business | 10 (full squad) | $100-150/mo |

### What We'd Pre-Configure

- Mission Control UI (React dashboard)
- Agent templates (pick your squad)
- Heartbeat crons (auto-setup)
- Notification system
- Daily standups to user's channel

### The Value

User doesn't need to:
- Write SOUL files
- Configure cron jobs
- Set up Convex
- Build notification daemon
- Create the UI

They just pick agents, assign tasks, and watch work happen.
