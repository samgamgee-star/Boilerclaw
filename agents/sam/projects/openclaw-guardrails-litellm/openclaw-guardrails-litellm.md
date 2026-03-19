# Token Protection & Guardrails — LiteLLM + TOOLS.md

> **Stack:** OpenClaw 7-agent setup · LiteLLM proxy as AI gateway · Per-agent virtual keys · Complexity-based routing · Local Ollama fallbacks

---

## Table of Contents

1. [How It Fits Together](#1-how-it-fits-together)
2. [Revised Model Tier Stack](#2-revised-model-tier-stack)
3. [Phase 1 — Install LiteLLM](#3-phase-1--install-litellm)
4. [Phase 1 — config.yaml (Full)](#4-phase-1--configyaml-full)
5. [Phase 1 — Pull Local Models](#5-phase-1--pull-local-models)
6. [Phase 1 — Create Per-Agent Virtual Keys](#6-phase-1--create-per-agent-virtual-keys)
7. [Phase 1 — Point OpenClaw at LiteLLM](#7-phase-1--point-openclaw-at-litellm)
8. [Phase 2 — Complexity-Based Auto Routing](#8-phase-2--complexity-based-auto-routing)
9. [Phase 3 — TOOLS.md Behavioral Guardrails](#9-phase-3--toolsmd-behavioral-guardrails)
10. [Admin Dashboard & Spend Monitoring](#10-admin-dashboard--spend-monitoring)
11. [Port Conflict Resolution](#11-port-conflict-resolution)
12. [Guardrail Summary](#12-guardrail-summary)
13. [Quick Reference](#13-quick-reference)

---

## 1. How It Fits Together

Without LiteLLM, every agent calls Codex directly — no visibility, no enforcement, no fallback logic.

```
BEFORE (flat, unguarded)
────────────────────────
OpenClaw agents ──────────────────────► Codex API  💸 always
                                        Minimax
                                        Ollama


AFTER (guarded, tiered)
───────────────────────
OpenClaw agents ──► LiteLLM :4001 ──► Codex API   (complex tasks only, budgeted)
                    [per-agent key]    Minimax      (mid tasks, budgeted)
                    [complexity router] Qwen/local  ($0, no budget check)
                    [RPM limits]
                    [fallback chain]
```

LiteLLM is a local proxy — it starts on your machine alongside OpenClaw and Mission Control.
OpenClaw agents are each given a **virtual key** scoped to their budget and model access.
All spend tracking, routing decisions, and hard limits live at the proxy level — not in agent behavior.

> **Port note:** LiteLLM defaults to `:4000`, which conflicts with Mission Control. We run LiteLLM on `:4001` throughout this guide.

---

## 2. Revised Model Tier Stack

Haiku is removed. The three tiers are now:

| Tier | Model | Cost | Use for |
|------|-------|------|---------|
| 1 — Premium | `openai-codex/gpt-5.4` | 💸 Cloud, expensive | Complex reasoning, code gen, multi-step planning |
| 2 — Mid | `ollama/minimax-m2.5:cloud` | 💲 Cloud, mid | Drafting, summarization, research, structured output |
| 3 — Local | `ollama/qwen2.5-coder:32b` (coding agents) | 🆓 Free | Code tasks, fallback, grunt work |
| 3 — Local | `ollama/qwen3:8b` (all others) | 🆓 Free | Classification, routing, rewrites, simple Q&A |

**Fallback chains by agent group:**

| Agent | Primary | Fallback 1 | Fallback 2 (free) |
|-------|---------|------------|-------------------|
| `sam`, `scribe` | codex | minimax | qwen3:8b |
| `forge`, `coder`, `speccer` | codex | minimax | qwen2.5-coder:32b |
| `archivist`, `scout` | minimax | codex | qwen3:8b |

> Local Ollama models cost $0. LiteLLM skips all budget checks for models configured with zero cost — meaning your local tier is a true free safety net.

---

## 3. Phase 1 — Install LiteLLM

```bash
# Install LiteLLM with proxy support
pip install 'litellm[proxy]'

# Verify
litellm --version
```

For a persistent process, use the systemd service or Docker (see Section 13).

### Minimal smoke test

```bash
# Start with no config just to confirm it runs
litellm --model ollama/qwen3:8b --port 4001

# In another terminal
curl http://localhost:4001/health
# Expected: {"status": "healthy"}
```

---

## 4. Phase 1 — config.yaml (Full)

Create `~/.litellm/config.yaml`. This is the complete configuration for your 7-agent stack.

```yaml
model_list:

  # ─── TIER 1: CODEX (premium, guarded) ────────────────────────────────────
  - model_name: codex
    litellm_params:
      model: openai/gpt-5.4
      api_key: os.environ/OPENAI_API_KEY

  # ─── TIER 2: MINIMAX (mid, cloud) ────────────────────────────────────────
  - model_name: minimax
    litellm_params:
      model: ollama/minimax-m2.5:cloud
      api_base: http://localhost:11434
      input_cost_per_token: 0.000002    # adjust to actual minimax pricing
      output_cost_per_token: 0.000006

  # ─── TIER 3: LOCAL — general (free) ──────────────────────────────────────
  - model_name: qwen-local
    litellm_params:
      model: ollama/qwen3:8b
      api_base: http://localhost:11434
      input_cost_per_token: 0           # $0 — bypasses all budget checks
      output_cost_per_token: 0

  # ─── TIER 3: LOCAL — coding (free) ───────────────────────────────────────
  - model_name: qwen-coder
    litellm_params:
      model: ollama/qwen2.5-coder:32b
      api_base: http://localhost:11434
      input_cost_per_token: 0           # $0 — bypasses all budget checks
      output_cost_per_token: 0

  # ─── SMART ALIASES (complexity-routed, per agent group) ──────────────────

  # Orchestrator + Comms: codex → minimax → qwen-local
  - model_name: tier-general
    litellm_params:
      model: codex
    model_info:
      id: tier-general
    fallbacks:
      - minimax
      - qwen-local

  # Coding + Infra + Spec: codex → minimax → qwen-coder
  - model_name: tier-coding
    litellm_params:
      model: codex
    model_info:
      id: tier-coding
    fallbacks:
      - minimax
      - qwen-coder

  # Doc ops + Scraping: minimax → codex → qwen-local
  - model_name: tier-research
    litellm_params:
      model: minimax
    model_info:
      id: tier-research
    fallbacks:
      - codex
      - qwen-local


router_settings:
  routing_strategy: complexity-based-routing   # score task → route to right tier automatically
  num_retries: 2
  timeout: 60
  allowed_fails: 3                             # cooldown a model after 3 failures in 1 min
  context_window_fallbacks:
    - {"codex": ["minimax"]}
    - {"minimax": ["qwen-local"]}
    - {"minimax": ["qwen-coder"]}


litellm_settings:
  drop_params: true          # silently drop unsupported params instead of erroring
  max_tokens: 4096           # global output cap — prevents runaway long completions
  request_timeout: 60


general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY   # generate: openssl rand -hex 32
  max_parallel_requests: 20                    # global concurrency cap
  disable_spend_logs: false                    # keep spend logs on
```

> The `complexity-based-routing` strategy scores incoming requests across 7 dimensions (token count, code presence, reasoning markers, technical terms, etc.) and routes to the appropriate model tier automatically — no embeddings or external API calls required.

---

## 5. Phase 1 — Pull Local Models

Make sure Ollama is running, then pull both local models:

```bash
# General fallback — fast, light
ollama pull qwen3:8b

# Coding fallback — heavier but GPT-4o level for code tasks
ollama pull qwen2.5-coder:32b

# Verify both are available
ollama list
```

Expected output includes both `qwen3:8b` and `qwen2.5-coder:32b`.

---

## 6. Phase 1 — Create Per-Agent Virtual Keys

First, start LiteLLM with your config:

```bash
litellm --config ~/.litellm/config.yaml --port 4001
```

Set your environment variables before starting:

```bash
export OPENAI_API_KEY=your-openai-key
export LITELLM_MASTER_KEY=sk-$(openssl rand -hex 32)
```

Now generate a virtual key for each agent. Each key is scoped to:
- A **monthly spend budget** (hard cap — calls block when exceeded)
- A **requests-per-minute limit** (loop + abuse protection)
- **Allowed models** (agents can only call their own tier alias)

```bash
# ─── SAM (orchestrator — highest budget, all tiers) ───────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "sam-key",
    "models": ["tier-general", "codex", "minimax", "qwen-local"],
    "max_budget": 40,
    "budget_duration": "30d",
    "rpm_limit": 30,
    "metadata": {"agent": "sam", "role": "orchestrator"}
  }'

# ─── FORGE (infra) ────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "forge-key",
    "models": ["tier-coding", "codex", "minimax", "qwen-coder"],
    "max_budget": 20,
    "budget_duration": "30d",
    "rpm_limit": 20,
    "metadata": {"agent": "forge", "role": "infra"}
  }'

# ─── CODER ────────────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "coder-key",
    "models": ["tier-coding", "codex", "minimax", "qwen-coder"],
    "max_budget": 30,
    "budget_duration": "30d",
    "rpm_limit": 20,
    "metadata": {"agent": "coder", "role": "coding"}
  }'

# ─── SPECCER ──────────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "speccer-key",
    "models": ["tier-coding", "codex", "minimax", "qwen-coder"],
    "max_budget": 20,
    "budget_duration": "30d",
    "rpm_limit": 15,
    "metadata": {"agent": "speccer", "role": "prd-spec"}
  }'

# ─── SCRIBE ───────────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "scribe-key",
    "models": ["tier-general", "minimax", "qwen-local"],
    "max_budget": 10,
    "budget_duration": "30d",
    "rpm_limit": 15,
    "metadata": {"agent": "scribe", "role": "internal-comms"}
  }'

# ─── ARCHIVIST ────────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "archivist-key",
    "models": ["tier-research", "minimax", "codex", "qwen-local"],
    "max_budget": 10,
    "budget_duration": "30d",
    "rpm_limit": 10,
    "metadata": {"agent": "archivist", "role": "doc-ops"}
  }'

# ─── SCOUT ────────────────────────────────────────────────────────────────
curl -X POST http://localhost:4001/key/generate \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "scout-key",
    "models": ["tier-research", "minimax", "codex", "qwen-local"],
    "max_budget": 10,
    "budget_duration": "30d",
    "rpm_limit": 10,
    "metadata": {"agent": "scout", "role": "lead-scraping"}
  }'
```

Each command returns a `sk-...` key. **Save these** — you'll need them in the next step.

> **Budget sizing note:** These are conservative starting budgets (USD/month). Adjust after your first week once you have real usage data from the dashboard. The free local tier ($0) doesn't count against any of these limits.

---

## 7. Phase 1 — Point OpenClaw at LiteLLM

Each agent in OpenClaw needs to use its virtual key and point to LiteLLM instead of the provider directly.

Update `~/.openclaw/openclaw.json` — add `modelProvider` settings per agent:

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
        "model": "tier-general",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-SAM-KEY"
        }
      },
      {
        "id": "forge",
        "name": "Forge",
        "workspace": "~/.openclaw/workspace-forge",
        "agentDir": "~/.openclaw/agents/forge/agent",
        "model": "tier-coding",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-FORGE-KEY"
        }
      },
      {
        "id": "coder",
        "name": "Coder",
        "workspace": "~/.openclaw/workspace-coder",
        "agentDir": "~/.openclaw/agents/coder/agent",
        "model": "tier-coding",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-CODER-KEY"
        }
      },
      {
        "id": "speccer",
        "name": "Speccer",
        "workspace": "~/.openclaw/workspace-speccer",
        "agentDir": "~/.openclaw/agents/speccer/agent",
        "model": "tier-coding",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-SPECCER-KEY"
        }
      },
      {
        "id": "scribe",
        "name": "Scribe",
        "workspace": "~/.openclaw/workspace-scribe",
        "agentDir": "~/.openclaw/agents/scribe/agent",
        "model": "tier-general",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-SCRIBE-KEY"
        }
      },
      {
        "id": "archivist",
        "name": "Archivist",
        "workspace": "~/.openclaw/workspace-archivist",
        "agentDir": "~/.openclaw/agents/archivist/agent",
        "model": "tier-research",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-ARCHIVIST-KEY"
        }
      },
      {
        "id": "scout",
        "name": "Scout",
        "workspace": "~/.openclaw/workspace-scout",
        "agentDir": "~/.openclaw/agents/scout/agent",
        "model": "tier-research",
        "modelProvider": {
          "apiBase": "http://localhost:4001",
          "apiKey": "sk-YOUR-SCOUT-KEY"
        }
      }
    ]
  }
}
```

Restart the gateway to apply:

```bash
openclaw gateway restart
```

---

## 8. Phase 2 — Complexity-Based Auto Routing

The `complexity-based-routing` strategy in LiteLLM scores each incoming request across multiple dimensions and automatically routes to the right model tier — no agent involvement required.

**What it scores:**
- Token count of the request
- Presence of code blocks or technical syntax
- Reasoning markers ("explain", "design", "architect", "why", "compare")
- Number of steps implied in the task
- Technical term density
- Estimated output length
- Tool use requirements

**What this means for your stack:**

| Request type | Score | Routes to |
|---|---|---|
| "Summarize this doc" | Low | qwen-local / qwen-coder |
| "Draft a reply to this email" | Low-mid | minimax |
| "Refactor this module and add tests" | High | codex |
| "Design the auth architecture for our API" | High | codex |
| "What's in this file?" | Low | qwen-local |

This requires no changes to your `config.yaml` beyond what's already set in Section 4 — `routing_strategy: complexity-based-routing` is already there.

To verify it's working after restart:

```bash
# Check proxy logs — look for routing decisions
litellm --config ~/.litellm/config.yaml --port 4001 --detailed_debug
```

You'll see lines like:
```
[Router] complexity score: 0.82 → routing to: codex
[Router] complexity score: 0.21 → routing to: qwen-local
```

---

## 9. Phase 3 — TOOLS.md Behavioral Guardrails

LiteLLM handles the hard infrastructure limits. TOOLS.md handles the soft behavioral rules — what the agent should do when it recognizes it's doing simple work, or when it detects it's in a loop.

Add the relevant block to each agent's `~/.openclaw/workspace-<id>/TOOLS.md`.

### Codex-primary agents: `sam`, `forge`, `coder`, `speccer`, `scribe`

```markdown
## Model Policy & Cost Guardrails

### Tier selection (before every task)
Before calling any model, classify the task:
- SIMPLE: summarize, reformat, lookup, short Q&A, route a message → use qwen-local or minimax
- COMPLEX: code generation, architecture decisions, multi-step reasoning, PRDs → use codex

Do not default to codex. Only escalate if the task genuinely requires it.

### Fallback chain
Primary:    codex (openai-codex/gpt-5.4)
Fallback 1: minimax (ollama/minimax-m2.5:cloud)
Fallback 2: qwen-local or qwen-coder (free, local)

On model error or rate limit → immediately try fallback 1, then fallback 2.
Log: which model was used, reason for fallback, task type, timestamp.

### Context management
- Summarize session history after 10 turns or ~8,000 tokens — do not let context grow unbounded
- Never include full file contents in context when a summary or diff is sufficient
- If a task requires >20 tool calls, pause and report to the user before continuing

### Loop detection
- If the same tool is called 5+ times with identical inputs in one session → stop and report
- If no meaningful progress after 3 consecutive model calls → stop and ask for clarification
- Never spawn sub-agents for tasks you can complete in 1-2 model calls

### Sub-agent model assignment
When spawning sub-agents for grunt work (formatting, data extraction, file ops):
→ assign qwen-local (free) unless the sub-task explicitly requires reasoning
→ never spawn a codex sub-agent for simple parallel tasks
```

### Minimax-primary agents: `archivist`, `scout`

```markdown
## Model Policy & Cost Guardrails

### Tier selection (before every task)
Primary model is minimax — use it for all standard tasks.
Only escalate to codex for tasks requiring deep reasoning or complex synthesis.
Always prefer qwen-local for simple classification, tagging, or formatting steps.

### Fallback chain
Primary:    minimax (ollama/minimax-m2.5:cloud)
Fallback 1: codex (openai-codex/gpt-5.4)
Fallback 2: qwen-local (ollama/qwen3:8b — free, local)

### Context management
- Summarize after 10 turns or ~8,000 tokens
- For doc processing: chunk documents, process per chunk, summarize — never load entire docs into context
- For lead scraping: batch process in groups of 20, not all at once

### Loop detection
- Stop after 5 identical tool calls with no new results
- For web scraping loops: max 3 retries per URL, then skip and log
- Report back after every 20 processed items, do not run silently for long batches
```

---

## 10. Admin Dashboard & Spend Monitoring

LiteLLM includes a built-in admin UI. Once the proxy is running:

```bash
# Set UI credentials (add to your environment or .env file)
export UI_USERNAME=admin
export UI_PASSWORD=your-secure-password
```

Open **http://localhost:4001/ui** — log in with your credentials.

From the dashboard you can:
- View spend per agent key in real time
- See which models are being called and at what rate
- Check remaining budget per key
- View request logs with model, tokens, cost, and latency per call
- Manually update or increase a key's budget if needed

### Check spend via API

```bash
# Total spend across all keys
curl http://localhost:4001/spend/logs \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"

# Spend for a specific key alias
curl "http://localhost:4001/spend/logs?api_key_alias=sam-key" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

---

## 11. Port Conflict Resolution

Mission Control runs on `:4000` by default. LiteLLM also defaults to `:4000`.
Run them on different ports:

| Service | Port | How to set |
|---|---|---|
| OpenClaw Gateway | `:18789` | default, no change |
| LiteLLM Proxy | `:4001` | `litellm --port 4001` |
| Mission Control | `:4000` | default, no change |

If you want to shift Mission Control instead:

```bash
# In mission-control/.env.local
PORT=3000
```

Then open Mission Control at **http://localhost:3000**.

### Running all three persistently

Use separate terminal sessions, tmux panes, or create a simple startup script:

```bash
#!/bin/bash
# start-all.sh

echo "Starting Ollama..."
ollama serve &

echo "Starting LiteLLM proxy..."
OPENAI_API_KEY=$OPENAI_API_KEY \
LITELLM_MASTER_KEY=$LITELLM_MASTER_KEY \
litellm --config ~/.litellm/config.yaml --port 4001 &

echo "Starting OpenClaw Gateway..."
openclaw gateway --port 18789 &

echo "Starting Mission Control..."
cd ~/mission-control && npm run dev &

echo "All services started."
echo "  LiteLLM:         http://localhost:4001"
echo "  LiteLLM UI:      http://localhost:4001/ui"
echo "  Mission Control: http://localhost:4000"
echo "  OpenClaw UI:     http://localhost:18789"
```

```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 12. Guardrail Summary

| Threat | Guardrail | Where enforced |
|---|---|---|
| Runaway Codex spend | Hard monthly budget per agent key | LiteLLM (blocks calls) |
| Agent loops | RPM limit per key + loop detection rules | LiteLLM + TOOLS.md |
| Simple tasks hitting Codex | Complexity-based router auto-downgrades | LiteLLM router |
| Bloated context windows | Context summarization policy + max_tokens cap | LiteLLM + TOOLS.md |
| Channel abuse / bot spam | RPM cap per key (spam = rate limited, not budgeted) | LiteLLM |
| Grunt sub-agents on Codex | Sub-agent model assignment rules | TOOLS.md |
| No visibility | Admin dashboard + spend logs per key | LiteLLM UI |
| Codex unavailable | Auto-fallback chain: codex → minimax → local | LiteLLM router |
| Budget exhausted | Falls back to free local models ($0) | LiteLLM (zero cost bypass) |

---

## 13. Quick Reference

```bash
# Install
pip install 'litellm[proxy]'

# Start proxy (with env vars set)
litellm --config ~/.litellm/config.yaml --port 4001

# Start with debug logging
litellm --config ~/.litellm/config.yaml --port 4001 --detailed_debug

# Health check
curl http://localhost:4001/health

# View all virtual keys
curl http://localhost:4001/key/list \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"

# Check spend for a key
curl "http://localhost:4001/spend/logs?api_key_alias=coder-key" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"

# Update a key's budget mid-month
curl -X POST http://localhost:4001/key/update \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key": "sk-YOUR-KEY", "max_budget": 50}'

# Pull local models
ollama pull qwen3:8b
ollama pull qwen2.5-coder:32b
ollama list

# Admin UI
open http://localhost:4001/ui
```

### Per-agent key summary

| Agent | Key alias | Monthly budget | RPM | Model alias |
|-------|-----------|---------------|-----|-------------|
| sam | `sam-key` | $40 | 30 | tier-general |
| forge | `forge-key` | $20 | 20 | tier-coding |
| coder | `coder-key` | $30 | 20 | tier-coding |
| speccer | `speccer-key` | $20 | 15 | tier-coding |
| scribe | `scribe-key` | $10 | 15 | tier-general |
| archivist | `archivist-key` | $10 | 10 | tier-research |
| scout | `scout-key` | $10 | 10 | tier-research |
| **Total** | | **$140/mo max** | | |

> Adjust these after your first week. The $140 ceiling is a safe starting point — real spend will likely be much lower once complexity routing redirects simple tasks to local models.

---

*Last updated: March 2026 · LiteLLM proxy + OpenClaw 7-agent stack*
