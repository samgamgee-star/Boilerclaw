# LOBSTER_MEMORY.md

Installed from the shared project source: `/Users/samuel/.openclaw/workspace-sam/projects/Lobster-Memory/Lobster-memory.md`.

Use this as the local runtime copy for this agent workspace. If the shared project source changes, sync this file again.

---

# lobster-memory.md — Agent Operating Instructions

> This file is loaded at every session start. Follow it before doing anything else.

---

## 1. Session Start Checklist

Do this at the beginning of every session, in order:

1. Run `memory_get` on `CHECKPOINT.md` — if it exists, read it fully and resume the active task before doing anything else.
2. Run `memory_get` on `MEMORY.md` — load long-term context, preferences, and decisions.
3. Run `memory_get` on today's daily log `memory/YYYY-MM-DD.md` — load what happened recently.
4. If `CHECKPOINT.md` exists and has an active task marked `status: in-progress`, announce to the user: *"Resuming [task name] from checkpoint — [brief summary of where we left off]."* Then continue autonomously.
5. If no checkpoint exists, greet normally and wait for instructions.

---

## 2. Memory Rules

### What goes where

| File | Purpose | When to write |
|---|---|---|
| `MEMORY.md` | Long-term facts, decisions, preferences, architecture | When something must survive forever |
| `memory/YYYY-MM-DD.md` | Daily running log, session context, what was done | Every session, append-only |
| `CHECKPOINT.md` | Active task state for restart recovery | Before any gateway restart or risky operation |

### Hard rules
- **Never keep important information only in conversation RAM.** If it matters, write it to a file.
- After the user says *"remember that..."* or *"going forward..."* → write it to `MEMORY.md` immediately, confirm with: *"Got it, saved to memory."*
- Before any `/compact` or context-heavy operation → flush active task context to today's daily log.
- Before any gateway restart → write a full checkpoint (see Section 3).
- `MEMORY.md` must stay under 200 lines. If it grows beyond that, split into topic files under `memory/` and add `@import` references.

### What belongs in MEMORY.md
- User preferences and working style
- Project architecture decisions and why they were made
- Recurring tools, credentials patterns, or integrations in use
- Known issues and their fixes
- Anything the user has explicitly asked to remember

---

## 3. Checkpoint Protocol

### When to create a checkpoint
- Before calling `openclaw gateway restart`
- Before any multi-step operation that could be interrupted
- When the user asks you to pause a long task
- When context window is getting large and compaction is near

### Checkpoint format

Write this to `CHECKPOINT.md` in the workspace root:

```markdown
# CHECKPOINT

status: in-progress
task: [short task name]
created: [YYYY-MM-DD HH:MM]
last_updated: [YYYY-MM-DD HH:MM]

## What I was doing
[1-2 sentence description of the active task]

## Progress
- [x] Step 1 — completed
- [x] Step 2 — completed
- [ ] Step 3 — IN PROGRESS (stopped here)
- [ ] Step 4 — pending
- [ ] Step 5 — pending

## Context I need to resume
[Any specific variables, file paths, IDs, API responses, or state
that would be lost if I had to start fresh]

## Next action
[The exact next thing to do when resuming — be specific enough
that no clarification from the user is needed]

## Blockers
[Anything that needs user input before resuming, if any. Leave blank if none.]
```

### After resuming
Once the task is complete, delete `CHECKPOINT.md` or update `status: done`.
Never leave a stale checkpoint with `status: in-progress` for a completed task.

---

## 4. Gateway Restart Protocol

If a task requires a gateway restart, follow these steps in order:

1. **Write checkpoint** to `CHECKPOINT.md` (Section 3 format).
2. **Write to daily log** — append a note to `memory/YYYY-MM-DD.md` saying the restart was initiated and why.
3. **Confirm with user** — send: *"I've saved my checkpoint. Restarting the gateway now — I'll pick up automatically when it's back."*
4. **Trigger restart** — use `openclaw gateway restart` or the appropriate Lobster workflow.
5. **On next session start** — the Session Start Checklist (Section 1) will detect the checkpoint and resume automatically.

> ⚠️ On macOS: do not call `openclaw gateway restart` from within an active agent session — it causes self-decapitation (the process dies and never restarts). Instead, use a Lobster workflow with a detached subprocess, or instruct the user to run `openclaw gateway install` from a separate terminal.

---

## 5. Lobster Workflows

Use Lobster for any multi-step operation that has side effects or needs to survive interruption.

### Enable Lobster (if not already enabled)
Add to `openclaw.json`:
```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

### Checkpoint-safe restart workflow

Save as `~/.openclaw/workspace/workflows/safe-restart.lobster`:

```yaml
name: safe-restart
steps:
  - id: write_checkpoint
    command: memory_write --file CHECKPOINT.md --from-stdin
    approval: required

  - id: notify_user
    command: openclaw.invoke --tool message --action send --args-json '{"body": "Checkpoint saved. Restarting gateway..."}'
    condition: $write_checkpoint.approved

  - id: restart
    command: openclaw gateway restart
    condition: $notify_user.ok
```

### General task pipeline pattern

```yaml
name: task-with-checkpoint
args:
  task_name:
    default: "unnamed-task"
steps:
  - id: save_checkpoint
    command: memory_write --file CHECKPOINT.md

  - id: run_task
    command: [your task command here]
    stdin: $save_checkpoint.stdout

  - id: approve_side_effects
    approval: required

  - id: execute
    command: [final execution step]
    condition: $approve_side_effects.approved

  - id: clear_checkpoint
    command: memory_write --file CHECKPOINT.md --content "status: done"
    condition: $execute.ok
```

To run a Lobster workflow:
```json
{
  "action": "run",
  "pipeline": "~/.openclaw/workspace/workflows/safe-restart.lobster",
  "timeoutMs": 30000
}
```

To resume after an approval gate:
```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

---

## 6. Compaction Safety

Compaction silently kills anything that only exists in conversation. Protect against it:

- Keep `memoryFlush.enabled: true` in config so OpenClaw auto-saves before compaction.
- When you notice the context getting large, proactively:
  1. Append current task state to today's daily log.
  2. Update `MEMORY.md` with any new decisions.
  3. Run `/compact` manually before it triggers automatically.
- Never rely on conversation history alone for task state — always have it mirrored in a file.

Recommended config additions for `openclaw.json`:
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "reserveTokensFloor": 20000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000
        }
      },
      "memory": {
        "memoryFlush": false,
        "persistenceMode": "hybrid",
        "searchStrategy": "qmd"
      }
    }
  }
}
```

---

## 7. Memory Search Behavior

- Before starting a task, run `memory_search` with relevant keywords to check if similar work was done before.
- When a user asks *"did we ever..."* or *"what did we decide about..."* → always use `memory_search` first before answering.
- Prefer `memory_get` for known files, `memory_search` for fuzzy recall.

---

## 8. Daily Log Format

Append to `memory/YYYY-MM-DD.md` throughout the session. Use this structure:

```markdown
## [HH:MM] — [Brief action title]
What happened, decisions made, outcomes.
Any file paths or IDs relevant to this action.
```

Example:
```markdown
## 14:32 — Gateway restart for plugin update
Wrote checkpoint before restart. Updated @mem0/openclaw-mem0 plugin to v1.4.
Resumed task "email triage setup" after restart successfully.
```

---

## 9. User Preferences

> This section should be filled in by the agent as it learns the user's preferences.
> Update MEMORY.md when new preferences are confirmed.

- *(Empty — agent will populate this over time)*

---

## 10. Known Issues & Fixes

> This section is maintained by the agent. Add entries when a bug is encountered and resolved.

- **macOS gateway self-restart bug**: calling `openclaw gateway restart` from within a session kills the process permanently. Workaround: use a detached Lobster subprocess or have the user run `openclaw gateway install` externally.
- **memoryFlush default**: ships as `true` (flush on restart). Change to `false` in production so memory persists across restarts.

---

*Last updated: [agent fills this in each session it modifies this file]*
