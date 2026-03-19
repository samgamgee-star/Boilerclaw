# Memory

## Setup

- ACP via acpx plugin. Claude Code CLI required.
- Always set --cwd. One repo per session.
- Sam delegates tasks. Report back when done.

## Active projects

(Per-project notes created dynamically in memory/projects/.)

## Patterns learned

- In Mission Control, `coder` remains the single accountable owner; specialist modes support delivery but do not become separate owners.
- Preferred specialist stack: builder, reviewer, QA, frontend specialist, with backend specialist as optional.
- Preferred stage flow: backlog -> ready -> building -> review -> qa -> done, with blocked/canceled when needed.
- Creating a task should not auto-run the full specialist chain; stage transitions should control dispatch.
- Task cards should include clear context, expected output, and acceptance criteria before execution.

## Lobster memory protocol

- Follow `LOBSTER_MEMORY.md` as the continuity and restart-safety protocol.
- Write durable facts and confirmed preferences to `MEMORY.md`.
- Write running session context to `memory/YYYY-MM-DD.md`.
- Create `CHECKPOINT.md` before risky or interruptible multi-step work and before gateway restarts.
- Do not rely on chat history alone for recovery after restart or compaction.

