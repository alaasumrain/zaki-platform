# LobeHub → OpenClaw mapping

**Purpose:** Map Lobe (zaki-dashboard) concepts to OpenClaw so we can wire "our agents" and "group thingy" to OpenClaw's agents and multi-agent features.

---

## 1. Agent (single)

| LobeHub | OpenClaw |
|--------|----------|
| **AgentItem** / **LobeAgentConfig** | **agents.list[]** entry in openclaw.json (one agent id + model, skills, system prompt) |
| `id`, `title`, `model`, `provider`, `systemRole`, `plugins`, `params` | `agentId`, `model.primary`, `systemPrompt`, `skills`, model params |
| **LobeAgentSession** = one chat with one agent (config + meta + type: Agent) | One **session** key for that agent (e.g. `agent:<agentId>:telegram:main`) |
| User "adds agent" in sidebar → createAgent / agentMap | Sync to OpenClaw: add or update entry in `agents.list` (and optionally `agents.defaults`) |

**Flow:** When user creates/edits an agent in Lobe, we can push that config to the user's OpenClaw gateway as an agent definition. When they chat with that agent in Lobe, the request goes to OpenClaw with that `agentId` (or we use a single default agent and pass system prompt/model per request).

---

## 2. Group (agents talking to each other)

| LobeHub | OpenClaw |
|--------|----------|
| **LobeGroupSession** (type: Group), **AgentGroupDetail** | Multi-agent: **sub-agents** and/or **broadcast groups** |
| **agents[]** = list of **AgentGroupMember** (each has agent + `isSupervisor`) | OpenClaw: one "main" agent can **spawn sub-agents** (`sessions_spawn`); or **broadcast** to multiple agents |
| **supervisorAgentId** = which agent coordinates the group | OpenClaw: the agent that calls `sessions_spawn` or the one that receives first and can delegate |
| **Group orchestration** (createGroupOrchestrationExecutors): Supervisor → call_agent / call_supervisor / parallel call agents | OpenClaw: **sub-agents** (main spawns child, child announces back); **broadcast** (multiple agents run on same message) |

**Flow:** Lobe "group chat" with supervisor + members → map to OpenClaw: supervisor = main agent; members = either sub-agent targets or broadcast list. When user sends a message in a Lobe group, we either (a) send to OpenClaw with a "group" session key and let OpenClaw run supervisor + sub-agents, or (b) call OpenClaw multiple times (once per member) and aggregate for broadcast-style.

---

## 3. Session / conversation

| LobeHub | OpenClaw |
|--------|----------|
| **Session** = LobeAgentSession or LobeGroupSession (id, config, meta, type) | **sessionKey** (e.g. `agent:<id>:channel:main` or `agent:<id>:subagent:<uuid>`) |
| **Topic** = thread inside a session (conversation branch) | OpenClaw can key by sessionKey; "topic" can be our own layer or a param we pass |
| **messageMap** / **ChatMessage** | OpenClaw persists history per sessionKey; we can sync or proxy |

---

## 4. Key Lobe types (reference)

- **AgentItem**: id, userId, title, model, provider, systemRole, plugins, chatConfig, params, meta (avatar, description, tags), createdAt, updatedAt.
- **LobeAgentConfig**: same plus fewShots, knowledgeBases, openingMessage, openingQuestions, tts, enableAgentMode (used at runtime).
- **LobeAgentSession**: id, type: Agent, config (LobeAgentConfig), meta, model, group?, pinned, tags.
- **LobeGroupSession**: id, type: Group, meta, members?: GroupMemberWithAgent[], group?, pinned, tags.
- **AgentGroupDetail**: extends ChatGroupItem with **agents** (AgentGroupMember[]) and **supervisorAgentId**.
- **AgentGroupMember**: AgentItem + isSupervisor, order, role, etc.

---

## 5. OpenClaw side (reference)

- **agents.list**: array of { id, model?, systemPrompt?, skills?, ... }.
- **agents.defaults**: default model, skills, sandbox, subagents config.
- **resolveAgentRoute(cfg, channel, accountId, peer)** → agentId, sessionKey, mainSessionKey.
- **Session keys**: `agent:<agentId>:<channel>:main`, `agent:<agentId>:subagent:<uuid>`, etc.
- **Sub-agents**: main agent calls `sessions_spawn`; child runs in isolated session; result announced back.
- **Broadcast**: multiple agents configured for same trigger; all run (e.g. sequentially).

---

## 6. Implementation notes

1. **Single agent:** Lobe agent create/update → POST/patch to OpenClaw config or gateway API (if exposed) to add/update `agents.list` and optionally `agents.defaults`. Chat from Lobe → HTTP/WS to user's gateway with that agentId (or default) and session key derived from session/topic id.
2. **Group:** On Lobe group create, ensure OpenClaw has the supervisor + member agents. On group message, either (a) use OpenClaw broadcast/supervisor flow if we add a "group" session shape, or (b) run Lobe's group orchestration (supervisor + call_agent) and have each member call go to OpenClaw as that agent's session.
3. **Session key shape:** We can derive OpenClaw sessionKey from Lobe (sessionId, topicId, groupId), e.g. `agent:<agentId>:lobe:<sessionId>:<topicId>` so history lines up.

This doc is the reference for "our agents become OpenClaw agents" and "the group thingy becomes agents in OpenClaw talking to each other."
