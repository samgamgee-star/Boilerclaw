# Safe Restart Runbook

Purpose: activate the Lobster-memory behavior cleanly across all agents without risking the macOS self-restart failure mode.

## What is already in place
- All 7 agent workspaces have `LOBSTER_MEMORY.md`.
- All 7 agent `AGENTS.md` files read `LOBSTER_MEMORY.md` at session start.
- All 7 agent `MEMORY.md` files include Lobster continuity/checkpoint guidance.
- Global config has Lobster enabled and compaction/memory settings applied in `~/.openclaw/openclaw.json`.

## Before restarting
For each agent workspace:
- ensure `CHECKPOINT.md` exists
- if the agent has active work, replace the template with a real in-progress checkpoint
- append a note to `memory/YYYY-MM-DD.md` describing why the restart is happening

## Recommended restart method on this Mac
Because macOS can self-kill active agent sessions on in-session restart:

### Preferred
Run this in a separate terminal outside the active agent session:
```bash
openclaw gateway restart
```

### If the restart needs to be delegated later
Use a detached external workflow/process, not an in-session direct restart command.

## After restart
1. Open a fresh session with the desired agent.
2. The agent should read `LOBSTER_MEMORY.md`, then `CHECKPOINT.md`, then `MEMORY.md`, then today's daily log.
3. If `CHECKPOINT.md` is `status: in-progress`, the agent should announce resumption and continue.
4. Once the resumed task finishes, mark `CHECKPOINT.md` done or clear it.

## Validation checklist
- [ ] Gateway is back online
- [ ] Fresh sessions open normally
- [ ] Agents read Lobster memory protocol at startup
- [ ] Active tasks resume from `CHECKPOINT.md`
- [ ] Daily logs capture the restart event

## Notes
Do not assume old live sessions fully adopt new instructions. The safest assumption is: fresh sessions after restart will follow the new startup behavior.
