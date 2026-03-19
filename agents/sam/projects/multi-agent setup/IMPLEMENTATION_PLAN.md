# Multi-Agent Setup — Implementation Plan

Adapted from `openclaw-multiagent-setup.md` for the current machine state.

## Current State

- Main workspace already migrated to `~/.openclaw/workspace-sam`
- Gateway is installed and running
- Existing config already contains local gateway/auth/tool settings
- This is **not** a clean install anymore, so changes should be merged carefully

## Goal

Create a 7-agent OpenClaw layout:

- `sam` (default orchestrator)
- `forge`
- `coder`
- `speccer`
- `scribe`
- `archivist`
- `scout`

Each agent should eventually have:

- its own workspace
- its own `agentDir`
- its own session store
- model policy aligned with the project brief
- Discord + Telegram account bindings

## Phases

### Phase 1 — Local agent structure

1. Convert from current single-agent/default setup to explicit multi-agent config
2. Create workspaces for:
   - `forge`
   - `coder`
   - `speccer`
   - `scribe`
   - `archivist`
   - `scout`
3. Preserve `sam` at `~/.openclaw/workspace-sam`
4. Ensure every agent has a unique `agentDir`

### Phase 2 — Workspace boilerplate

For each workspace:

- seed `AGENTS.md`
- seed `SOUL.md`
- seed `USER.md`
- seed `TOOLS.md`
- add role-specific identity notes
- add model fallback policy notes from the brief

### Phase 3 — Config merge

Merge `~/.openclaw/openclaw.json` into a target state that keeps:

- current gateway auth/token
- current tool/web config
- existing command/session settings

And adds:

- `agents.list` for all 7 agents
- default agent = `sam`
- per-agent model defaults
- `bindings` scaffold for Discord + Telegram account routing
- `tools.agentToAgent.enabled = true`

### Phase 4 — Channel onboarding

When tokens are ready:

- log in 7 Discord bot accounts
- log in 7 Telegram bot accounts
- verify account IDs match config bindings
- probe channel status

### Phase 5 — Verification

- restart gateway
- run `openclaw agents list --bindings`
- run `openclaw channels status --probe`
- verify default routing lands on `sam`
- verify account-based routing lands on the intended agent

## Important Constraints

- Do **not** share `agentDir` across agents
- Do **not** overwrite the entire config blindly
- Treat fallback chains as policy/config work, not automatic behavior unless verified
- Restart the gateway after structural config changes

## Immediate Next Action

Build the explicit 7-agent config scaffold and create the six missing agent workspaces.
