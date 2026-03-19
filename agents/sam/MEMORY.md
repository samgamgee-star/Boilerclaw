# Memory

## Architecture

- Gateway runs 7 core agents: sam, forge, coder, speccer, scribe, archivist, scout.
- 4 sales agents planned: outreach, rep, creative, pipeline.
- Sam is default agent (handles all unmatched messages).
- All agents live under `~/.openclaw/workspace/agents/<agentId>/`.
- Shared workspace at `~/.openclaw/workspace/` for registry, projects, skills.
- Agent-to-agent: `sessions_send`. Sub-agents: `sessions_spawn`.

## Planeskeeper

- Premium TCG card sleeves. 5 colors. 110-pack. Amazon live.
- Expanding to local retail, starting NJ → national.
- Competitors: Dragon Shield ($11-14), Ultra Pro ($4-8), Ultimate Guard ($10-13), KMC ($6-10), Gamegenic ($8-12).
- Brand voice: Knowledgeable but not elitist, passionate but professional, community-rooted.

## Current agents

- **sam** — Orchestrator. Default. Discord.
- **forge** — Infrastructure. Internal only.
- **coder** — Full stack dev. ACP/Claude Code.
- **speccer** — PRD architect.
- **scribe** — Brand copywriter / internal comms.
- **archivist** — Doc ops, Notion sync.
- **scout** — Lead scraping.

## Models

- codex = `openai-codex/gpt-5.3-codex` (primary for sam, forge, coder, speccer, scribe)
- minimax = `ollama/minimax-m2.5:cloud` (primary for archivist, scout)
- haiku = `anthropic/claude-haiku-4-5-20251001` (fallback)

## Operating preferences

- Use the Lobster Memory project in `projects/Lobster-Memory/` as the source of truth for continuity and restart safety.
- Roll Lobster memory concepts out to every agent, not just Sam.
- Before working on any project, first inspect the relevant file(s) under `workspace/projects/`.
- Avoid noisy inter-agent readiness pings that surface raw agent replies to the user; prefer quieter verification methods unless the user explicitly wants the live responses.
- Use `CHECKPOINT.md` before risky or interruptible multi-step work.
- Use `memory/YYYY-MM-DD.md` as the running daily log.
- For Mission Control, Sam should plan tasks with structured fields and use stage-based dispatch rather than treating task creation as immediate execution.
- For now, test the Mission Control workflow first with Sam + Coder before expanding it to more agents.

## Lobster memory protocol

- Follow `LOBSTER_MEMORY.md` as the continuity and restart-safety protocol.
- Write durable facts and confirmed preferences to `MEMORY.md`.
- Write running session context to `memory/YYYY-MM-DD.md`.
- Create `CHECKPOINT.md` before risky or interruptible multi-step work and before gateway restarts.
- Do not rely on chat history alone for recovery after restart or compaction.

## Pending

- Build 4 sales agents (outreach, rep, creative, pipeline)
- Deploy Scout, start NJ prospecting
- Execute wiki build (Scribe writes, Archivist pushes to Notion)
- Tower Watch dashboard (kanban for monitoring agent tasks)
- ACP/Claude Code setup (acpx plugin install)
- Partner names and roles TBD
- Pricing/MOQ/supplier details TBD
