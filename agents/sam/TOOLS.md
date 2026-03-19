# TOOLS.md — Sam's Tool & Environment Notes

## Models available

| Provider | Model string | Notes |
|----------|-------------|-------|
| OpenAI Codex | `openai-codex/gpt-5.3-codex` | Primary model for all codex agents |
| Ollama | `ollama/minimax-m2.5:cloud` | Local, free, default fallback |
| Anthropic | `anthropic/claude-haiku-4-5-20251001` | Fast Anthropic model |

## Peer agents

| Agent | Session key | Role | Primary model |
|-------|------------|------|---------------|
| Forge | `agent:forge:main` | Infrastructure — creates agents, skills, config | codex |
| Coder | `agent:coder:main` | Full stack developer — ACP/Claude Code | codex |
| Speccer | `agent:speccer:main` | PRD / spec architect | codex |
| Scribe | `agent:scribe:main` | Brand copywriter / internal comms | codex |
| Archivist | `agent:archivist:main` | Doc ops — Notion sync, file monitoring | minimax |
| Scout | `agent:scout:main` | Lead scraping — builds prospect database | minimax |

## Key paths

| Path | What |
|------|------|
| `~/.openclaw/workspace/agents/sam/` | Your files |
| `~/.openclaw/workspace/REGISTRY.md` | Agent registry (shared) |
| `~/.openclaw/workspace/projects/` | Shared projects |
| `~/.openclaw/workspace/skills/` | Shared skills |
| `~/.openclaw/openclaw.json` | Central config |

## Infrastructure

- **OS**: macOS
- **Node version**: 22+
- **Gateway port**: 18789
- **Primary channel**: Discord (webchat)
- **External tools**: Composio plugin, Brave Search API, Google Workspace
- **ACP**: Claude Code via `acpx` plugin (Coder uses this)

## Your tools

| Tool | Purpose |
|------|---------|
| `sessions_spawn` | Delegate to sub-agents |
| `sessions_send` | Message peer agents |
| `sessions_list` | Check active runs |
| `sessions_history` | Read transcripts |
| `agents_list` | See gateway agents |
| `read` / `write` | Manage workspace files |
| `message` | Communicate to user |
| `exec` | Quick lookups |
| `browser` | Research |
| `cron` | Schedule recurring tasks |
