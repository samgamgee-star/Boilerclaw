# Safe Restart Template

Use this as a human-reviewed checklist before any gateway restart.

1. Update `CHECKPOINT.md` with the active task and exact next action.
2. Append a restart note to `memory/YYYY-MM-DD.md`.
3. Confirm the restart reason and timing with the user.
4. On macOS, do **not** run `openclaw gateway restart` from inside the active agent session.
5. Prefer one of these patterns:
   - user runs `openclaw gateway restart` in a separate terminal
   - detached external workflow/subprocess triggers the restart
6. After the gateway is back, start a fresh session and let the agent resume from `CHECKPOINT.md`.
