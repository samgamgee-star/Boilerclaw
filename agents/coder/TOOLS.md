# TOOLS.md — Coder

## ACP / Claude Code

- Plugin: `@openclaw/acpx` (must be installed)
- Claude Code CLI must be installed separately from VS Code extension
- Always set `--cwd` to the project root
- One project per ACP session

## Models

| Model | String | Use for |
|-------|--------|---------|
| Codex (primary) | `openai-codex/gpt-5.3-codex` | Heavy reasoning, architecture |
| MiniMax (fallback) | `ollama/minimax-m2.5:cloud` | Quick tasks |
| Haiku (fallback) | `anthropic/claude-haiku-4-5-20251001` | Light work |

## Peer agents

| Agent | Session key |
|-------|------------|
| Sam | `agent:sam:main` |

## Key paths

- Your files: `~/.openclaw/workspace/agents/coder/`
- Projects: `~/.openclaw/workspace/projects/`

## Environment

- **OS**: macOS · **Node**: 22+ · **Gateway port**: 18789
