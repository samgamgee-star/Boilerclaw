# OpenClaw Multi-Agent Setup + Mission Control Integration

> **Clean install · 7 agents · Telegram + Discord · Independent bot per agent · Mission Control dashboard**

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Agent Roster & Models](#2-agent-roster--models)
3. [Fallback Chain Policy](#3-fallback-chain-policy)
4. [Prerequisites](#4-prerequisites)
5. [Step 1 — Onboard OpenClaw](#5-step-1--onboard-openclaw)
6. [Step 2 — Create All 7 Agents](#6-step-2--create-all-7-agents)
7. [Step 3 — Register Discord Bots](#7-step-3--register-discord-bots)
8. [Step 4 — Register Telegram Bots](#8-step-4--register-telegram-bots)
9. [Step 5 — Full openclaw.json Config](#9-step-5--full-openclawjson-config)
10. [Step 6 — Bind Channels](#10-step-6--bind-channels)
11. [Step 7 — Write Fallback Policy to Each Agent](#11-step-7--write-fallback-policy-to-each-agent)
12. [Step 8 — Install Mission Control](#12-step-8--install-mission-control)
13. [Step 9 — Connect Mission Control to Gateway](#13-step-9--connect-mission-control-to-gateway)
14. [Step 10 — Restart & Verify](#14-step-10--restart--verify)
15. [Routing Logic](#15-routing-logic)
16. [Common Mistakes to Avoid](#16-common-mistakes-to-avoid)
17. [Quick Reference Commands](#17-quick-reference-commands)
18. [Agent Quick Reference](#18-agent-quick-reference)

---

## 1. Architecture Overview

```
                         ┌────────────────────────────────────────┐
                         │              YOUR MACHINE              │
                         │                                        │
  Telegram Bot (sam)   ─►│                                        │
  Telegram Bot (forge) ─►│   OpenClaw Gateway :18789              │
  Telegram Bot (coder) ─►│   ┌──────────────────────────────┐    │
  Telegram Bot (speccer)►│   │  sam        (orchestrator)   │    │
  Telegram Bot (scribe)─►│   │  forge      (infra)          │    │
  Telegram Bot (arch)  ─►│   │  coder      (coding)         │    │
  Telegram Bot (scout) ─►│   │  speccer    (PRD / spec)     │    │
                         │   │  scribe     (internal comms) │    │
  Discord Bot (sam)    ─►│   │  archivist  (doc ops)        │    │
  Discord Bot (forge)  ─►│   │  scout      (lead scraping)  │    │
  Discord Bot (coder)  ─►│   └──────────────────────────────┘    │
  Discord Bot (speccer)─►│                │                       │
  Discord Bot (scribe) ─►│                ▼                       │
  Discord Bot (arch)   ─►│   Mission Control :4000                │
  Discord Bot (scout)  ─►│   (Task board + agent orchestration)   │
                         └────────────────────────────────────────┘
```

One Gateway process. One Mission Control dashboard. Every agent has its own bot identity, workspace, session store, and model policy. Sam is the default orchestrator — anything unrouted lands with him.

---

## 2. Agent Roster & Models

| Agent ID    | Role           | Primary Model                         | Fallback 1                            | Fallback 2                             | Default |
|-------------|----------------|---------------------------------------|---------------------------------------|----------------------------------------|---------|
| `sam`       | Orchestrator   | `openai-codex/gpt-5.4`          | `ollama/minimax-m2.5:cloud`           | `anthropic/claude-haiku-4-5-20251001`  | ✅ Yes  |
| `forge`     | Infra          | `openai-codex/gpt-5.4`          | `ollama/minimax-m2.5:cloud`           | `anthropic/claude-haiku-4-5-20251001`  | No      |
| `coder`     | Coding         | `openai-codex/gpt-5.4`          | `ollama/minimax-m2.5:cloud`           | `anthropic/claude-haiku-4-5-20251001`  | No      |
| `speccer`   | PRD / Spec     | `openai-codex/gpt-5.4`          | `ollama/minimax-m2.5:cloud`           | `anthropic/claude-haiku-4-5-20251001`  | No      |
| `scribe`    | Internal comms | `openai-codex/gpt-5.4`          | `ollama/minimax-m2.5:cloud`           | `anthropic/claude-haiku-4-5-20251001`  | No      |
| `archivist` | Doc ops        | `ollama/minimax-m2.5:cloud`           | `openai-codex/gpt-5.4`          | `anthropic/claude-haiku-4-5-20251001`  | No      |
| `scout`     | Lead scraping  | `ollama/minimax-m2.5:cloud`           | `openai-codex/gpt-5.4`          | `anthropic/claude-haiku-4-5-20251001`  | No      |

---

## 3. Fallback Chain Policy

### Codex-primary agents — `sam`, `forge`, `coder`, `speccer`, `scribe`

```
openai-codex/gpt-5.4
        ↓  (unavailable / rate-limited)
ollama/minimax-m2.5:cloud
        ↓  (unavailable)
anthropic/claude-haiku-4-5-20251001
```

### Minimax-primary agents — `archivist`, `scout`

```
ollama/minimax-m2.5:cloud
        ↓  (unavailable / rate-limited)
openai-codex/gpt-5.4
        ↓  (unavailable)
anthropic/claude-haiku-4-5-20251001
```

> Fallbacks are not automatic unless encoded in each agent's `TOOLS.md` and model registry. See [Step 7](#11-step-7--write-fallback-policy-to-each-agent) to make them official.

---

## 4. Prerequisites

- Node 24 (recommended) or Node 22.16+ LTS
- `npm install -g openclaw@latest` — fresh clean install
- API keys ready: OpenAI Codex, Minimax (Ollama), Anthropic
- 7 Discord bots to be created (one per agent)
- 7 Telegram bots to be created via BotFather (one per agent)
- Node.js v18+ for Mission Control

---

## 5. Step 1 — Onboard OpenClaw

```bash
openclaw onboard --install-daemon
```

This sets up the gateway config, daemon, and default directory structure at `~/.openclaw/`. When prompted for a default agent, use `sam`.

Start the gateway:

```bash
openclaw gateway --port 18789
```

Open the Control UI at **http://127.0.0.1:18789/** to confirm it's live.

---

## 6. Step 2 — Create All 7 Agents

Since this is a clean install, all agents are created fresh with clean IDs matching their role names.

```bash
# Sam is created during onboarding — set his identity
openclaw agents set-identity --agent sam       --name "Sam"       --emoji "🧠"

# Create the 6 specialist agents
openclaw agents add forge     --workspace ~/.openclaw/workspace-forge
openclaw agents add coder     --workspace ~/.openclaw/workspace-coder
openclaw agents add speccer   --workspace ~/.openclaw/workspace-speccer
openclaw agents add scribe    --workspace ~/.openclaw/workspace-scribe
openclaw agents add archivist --workspace ~/.openclaw/workspace-archivist
openclaw agents add scout     --workspace ~/.openclaw/workspace-scout

# Set identities for all specialists
openclaw agents set-identity --agent forge     --name "Forge"     --emoji "🔧"
openclaw agents set-identity --agent coder     --name "Coder"     --emoji "💻"
openclaw agents set-identity --agent speccer   --name "Speccer"   --emoji "📐"
openclaw agents set-identity --agent scribe    --name "Scribe"    --emoji "✍️"
openclaw agents set-identity --agent archivist --name "Archivist" --emoji "🗂️"
openclaw agents set-identity --agent scout     --name "Scout"     --emoji "🔍"
```

Confirm all 7 exist:

```bash
openclaw agents list
```

---

## 7. Step 3 — Register Discord Bots

Create 7 Discord applications at **https://discord.com/developers/applications**.

For each one:
1. **New Application** → give it the agent's name
2. Go to **Bot** tab → **Reset Token** → copy the token
3. Enable **Message Content Intent** under Privileged Gateway Intents
4. Invite the bot to your server with appropriate permissions

Then log each into OpenClaw:

```bash
openclaw channels login --channel discord --account sam-bot
openclaw channels login --channel discord --account forge-bot
openclaw channels login --channel discord --account coder-bot
openclaw channels login --channel discord --account speccer-bot
openclaw channels login --channel discord --account scribe-bot
openclaw channels login --channel discord --account archivist-bot
openclaw channels login --channel discord --account scout-bot
```

Paste the corresponding bot token when prompted for each.

---

## 8. Step 4 — Register Telegram Bots

Open Telegram → search `@BotFather` → `/newbot` — repeat 7 times, once per agent.
Name them clearly (e.g. `SamAgent`, `ForgeAgent`, etc.). Copy each token.

```bash
openclaw channels login --channel telegram --account sam-tg
openclaw channels login --channel telegram --account forge-tg
openclaw channels login --channel telegram --account coder-tg
openclaw channels login --channel telegram --account speccer-tg
openclaw channels login --channel telegram --account scribe-tg
openclaw channels login --channel telegram --account archivist-tg
openclaw channels login --channel telegram --account scout-tg
```

---

## 9. Step 5 — Full openclaw.json Config

Edit `~/.openclaw/openclaw.json`. This is the complete target state for your 7-agent setup.

```json
{
  "agents": {
    "list": [
      {
        "id": "sam",
        "default": true,
        "name": "Sam",
        "workspace": "~/.openclaw/workspace-sam",
        "agentDir": "~/.openclaw/agents/sam/agent",
        "model": "openai-codex/gpt-5.4"
      },
      {
        "id": "forge",
        "name": "Forge",
        "workspace": "~/.openclaw/workspace-forge",
        "agentDir": "~/.openclaw/agents/forge/agent",
        "model": "openai-codex/gpt-5.4"
      },
      {
        "id": "coder",
        "name": "Coder",
        "workspace": "~/.openclaw/workspace-coder",
        "agentDir": "~/.openclaw/agents/coder/agent",
        "model": "openai-codex/gpt-5.4"
      },
      {
        "id": "speccer",
        "name": "Speccer",
        "workspace": "~/.openclaw/workspace-speccer",
        "agentDir": "~/.openclaw/agents/speccer/agent",
        "model": "openai-codex/gpt-5.4"
      },
      {
        "id": "scribe",
        "name": "Scribe",
        "workspace": "~/.openclaw/workspace-scribe",
        "agentDir": "~/.openclaw/agents/scribe/agent",
        "model": "openai-codex/gpt-5.4"
      },
      {
        "id": "archivist",
        "name": "Archivist",
        "workspace": "~/.openclaw/workspace-archivist",
        "agentDir": "~/.openclaw/agents/archivist/agent",
        "model": "ollama/minimax-m2.5:cloud"
      },
      {
        "id": "scout",
        "name": "Scout",
        "workspace": "~/.openclaw/workspace-scout",
        "agentDir": "~/.openclaw/agents/scout/agent",
        "model": "ollama/minimax-m2.5:cloud"
      }
    ]
  },
  "bindings": [
    { "agentId": "sam",       "match": { "channel": "discord",  "accountId": "sam-bot" } },
    { "agentId": "forge",     "match": { "channel": "discord",  "accountId": "forge-bot" } },
    { "agentId": "coder",     "match": { "channel": "discord",  "accountId": "coder-bot" } },
    { "agentId": "speccer",   "match": { "channel": "discord",  "accountId": "speccer-bot" } },
    { "agentId": "scribe",    "match": { "channel": "discord",  "accountId": "scribe-bot" } },
    { "agentId": "archivist", "match": { "channel": "discord",  "accountId": "archivist-bot" } },
    { "agentId": "scout",     "match": { "channel": "discord",  "accountId": "scout-bot" } },
    { "agentId": "sam",       "match": { "channel": "telegram", "accountId": "sam-tg" } },
    { "agentId": "forge",     "match": { "channel": "telegram", "accountId": "forge-tg" } },
    { "agentId": "coder",     "match": { "channel": "telegram", "accountId": "coder-tg" } },
    { "agentId": "speccer",   "match": { "channel": "telegram", "accountId": "speccer-tg" } },
    { "agentId": "scribe",    "match": { "channel": "telegram", "accountId": "scribe-tg" } },
    { "agentId": "archivist", "match": { "channel": "telegram", "accountId": "archivist-tg" } },
    { "agentId": "scout",     "match": { "channel": "telegram", "accountId": "scout-tg" } }
  ],
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["sam", "forge", "coder", "speccer", "scribe", "archivist", "scout"]
    }
  },
  "channels": {
    "discord":  { "defaultAccount": "sam-bot" },
    "telegram": { "defaultAccount": "sam-tg" }
  }
}
```

---

## 10. Step 6 — Bind Channels

```bash
# Discord
openclaw agents bind --agent sam       --bind discord:sam-bot
openclaw agents bind --agent forge     --bind discord:forge-bot
openclaw agents bind --agent coder     --bind discord:coder-bot
openclaw agents bind --agent speccer   --bind discord:speccer-bot
openclaw agents bind --agent scribe    --bind discord:scribe-bot
openclaw agents bind --agent archivist --bind discord:archivist-bot
openclaw agents bind --agent scout     --bind discord:scout-bot

# Telegram
openclaw agents bind --agent sam       --bind telegram:sam-tg
openclaw agents bind --agent forge     --bind telegram:forge-tg
openclaw agents bind --agent coder     --bind telegram:coder-tg
openclaw agents bind --agent speccer   --bind telegram:speccer-tg
openclaw agents bind --agent scribe    --bind telegram:scribe-tg
openclaw agents bind --agent archivist --bind telegram:archivist-tg
openclaw agents bind --agent scout     --bind telegram:scout-tg
```

---

## 11. Step 7 — Write Fallback Policy to Each Agent

Add the appropriate `TOOLS.md` block to each agent's workspace. This makes the fallback chain official and visible to the agent at runtime.

### Codex-primary agents (`sam`, `forge`, `coder`, `speccer`, `scribe`)

Add to `~/.openclaw/workspace-<agentId>/TOOLS.md`:

```markdown
## Model Policy

Primary: openai-codex/gpt-5.4
Fallback chain (in order):
1. ollama/minimax-m2.5:cloud
2. anthropic/claude-haiku-4-5-20251001

If the primary model returns an error or is rate-limited, retry with fallback 1.
If fallback 1 also fails, retry with fallback 2.
Log the fallback event with: model used, reason for fallback, timestamp.
```

### Minimax-primary agents (`archivist`, `scout`)

Add to `~/.openclaw/workspace-<agentId>/TOOLS.md`:

```markdown
## Model Policy

Primary: ollama/minimax-m2.5:cloud
Fallback chain (in order):
1. openai-codex/gpt-5.4
2. anthropic/claude-haiku-4-5-20251001

If the primary model returns an error or is rate-limited, retry with fallback 1.
If fallback 1 also fails, retry with fallback 2.
Log the fallback event with: model used, reason for fallback, timestamp.
```

Also encode the chain in each agent's model registry under `~/.openclaw/agents/<agentId>/agent/` — list all three models in priority order so OpenClaw's model resolution picks the first available.

---

## 12. Step 8 — Install Mission Control

Mission Control (also known as Autensa) is a Next.js dashboard that connects to your Gateway via WebSocket. It gives you a Kanban task board, real-time agent monitoring, AI-assisted task planning, and one-click agent import.

```bash
git clone https://github.com/crshdn/mission-control.git
cd mission-control
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required
OPENCLAW_GATEWAY_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your-gateway-token-here
# Find the token in ~/.openclaw/openclaw.json under gateway.token

# Recommended for production
MC_API_TOKEN=your-64-char-hex-token
WEBHOOK_SECRET=your-64-char-hex-token

# Optional
DATABASE_PATH=./mission-control.db
WORKSPACE_BASE_PATH=~/Documents/Shared
PROJECTS_PATH=~/Documents/Shared/projects
```

Generate secure tokens:

```bash
openssl rand -hex 32   # paste as MC_API_TOKEN
openssl rand -hex 32   # paste as WEBHOOK_SECRET
```

Start Mission Control:

```bash
# Development
npm run dev

# Production
npm run build && npx next start -p 4000
```

Open **http://localhost:4000**.

### Docker (optional)

```bash
cp .env.example .env
# In .env, set: OPENCLAW_GATEWAY_URL=ws://host.docker.internal:18789
docker compose up -d --build
docker compose logs -f mission-control
```

---

## 13. Step 9 — Connect Mission Control to Gateway

1. Open **http://localhost:4000**
2. Go to **Settings** → confirm Gateway shows **Connected**
3. Click **Import Agents** — all 7 agents are auto-discovered from the running Gateway
4. Agents appear in the sidebar: Sam, Forge, Coder, Speccer, Scribe, Archivist, Scout

From here you can:

- Create tasks and assign them to specific agents
- Use the AI Planning flow — Mission Control asks clarifying questions, then dispatches
- Monitor live activity in the **Live Feed**
- Move tasks across the board: `PLANNING → INBOX → ASSIGNED → IN PROGRESS → TESTING → REVIEW → DONE`

---

## 14. Step 10 — Restart & Verify

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

Expected output: 7 agents, each with 2 bindings (one Discord, one Telegram), `sam` marked `default: true`.

---

## 15. Routing Logic

Since each agent has its own dedicated bot token, routing is purely `accountId`-based. No peer or guild matching is needed.

| Message arrives via...       | Routes to...  | Reason                                 |
|------------------------------|---------------|----------------------------------------|
| Discord bot `sam-bot`        | `sam`         | `accountId: "sam-bot"` binding         |
| Discord bot `forge-bot`      | `forge`       | `accountId: "forge-bot"` binding       |
| Discord bot `coder-bot`      | `coder`       | `accountId: "coder-bot"` binding       |
| Discord bot `speccer-bot`    | `speccer`     | `accountId: "speccer-bot"` binding     |
| Discord bot `scribe-bot`     | `scribe`      | `accountId: "scribe-bot"` binding      |
| Discord bot `archivist-bot`  | `archivist`   | `accountId: "archivist-bot"` binding   |
| Discord bot `scout-bot`      | `scout`       | `accountId: "scout-bot"` binding       |
| Telegram `sam-tg`            | `sam`         | `accountId: "sam-tg"` binding          |
| Any unmatched message        | `sam`         | `default: true` fallback               |

Same `accountId` pattern applies across all Telegram bots via the `-tg` accounts.

---

## 16. Common Mistakes to Avoid

| Mistake | Impact | Fix |
|---------|--------|-----|
| Sharing `agentDir` between agents | Silent auth credential overwrite | Every agent must have a unique path |
| Missing `accountId` on a binding | Messages fall through to Sam | Always specify `accountId` with multiple bots |
| Wrong `OPENCLAW_GATEWAY_TOKEN` in `.env.local` | Mission Control won't connect | Check `gateway.token` in `~/.openclaw/openclaw.json` |
| Not enabling Message Content Intent on Discord | Bot can't read messages | Enable in Discord Developer Portal → Bot settings |
| Forgetting to restart gateway after editing config | Changes not applied | Always run `openclaw gateway restart` |
| Fallback in `TOOLS.md` only, not model registry | Runtime doesn't enforce fallback | Encode in both `TOOLS.md` and model registry |

---

## 17. Quick Reference Commands

```bash
# Agent management
openclaw agents list --bindings
openclaw agents add <id> --workspace ~/.openclaw/workspace-<id>
openclaw agents set-identity --agent <id> --name "Name" --emoji "🔧"
openclaw agents bind   --agent <id> --bind <channel>:<accountId>
openclaw agents unbind --agent <id> --bind <channel>:<accountId>

# Gateway
openclaw gateway start
openclaw gateway restart
openclaw gateway stop
openclaw gateway status
openclaw gateway logs

# Channels
openclaw channels login --channel <channel> --account <accountId>
openclaw channels status --probe

# Mission Control (from mission-control/ directory)
npm run dev
npm run build && npx next start -p 4000
docker compose up -d --build
docker compose logs -f mission-control
```

---

## 18. Agent Quick Reference

| Agent    | Role           | Primary | Fallback Chain              | Discord Account   | Telegram Account   |
|----------|----------------|---------|-----------------------------|-------------------|--------------------|
| `sam`    | Orchestrator   | codex   | codex → minimax → haiku     | `sam-bot`         | `sam-tg`           |
| `forge`  | Infra          | codex   | codex → minimax → haiku     | `forge-bot`       | `forge-tg`         |
| `coder`  | Coding         | codex   | codex → minimax → haiku     | `coder-bot`       | `coder-tg`         |
| `speccer`| PRD / Spec     | codex   | codex → minimax → haiku     | `speccer-bot`     | `speccer-tg`       |
| `scribe` | Internal comms | codex   | codex → minimax → haiku     | `scribe-bot`      | `scribe-tg`        |
| `archivist` | Doc ops     | minimax | minimax → codex → haiku     | `archivist-bot`   | `archivist-tg`     |
| `scout`  | Lead scraping  | minimax | minimax → codex → haiku     | `scout-bot`       | `scout-tg`         |

---

*Last updated: March 2026 · OpenClaw fresh install + Mission Control v1.5.0*
