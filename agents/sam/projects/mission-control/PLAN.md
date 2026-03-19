# Mission Control Recovery Plan

## Goal
Restore the originally planned agent model split, start Mission Control, verify gateway connectivity, and clean/import agents so the dashboard reflects the intended 7-agent setup.

## Tasks
1. Inspect current OpenClaw config and Mission Control state.
2. Apply planned model split:
   - sam, forge, coder, speccer, scribe => `openai-codex/gpt-5.4`
   - archivist, scout => `ollama/minimax-m2.5:cloud`
3. Restart/reload affected services as needed.
4. Start Mission Control.
5. Verify Mission Control connects to the gateway.
6. Clean stale/existing agent records in Mission Control if needed.
7. Import/discover agents from the gateway.
8. Validate final agent list and report blockers.
9. Run a minimal end-to-end task dispatch test through Mission Control.
10. Create a temporary demo task cycler that advances a task through board stages every 15 seconds for visual verification.
11. Run a real lightweight end-to-end workflow through Mission Control with actual deliverables, activities, assignments, dispatches, and stage transitions.
12. Fix duplicate dispatches during testing/review handoffs.

## Success Criteria
- OpenClaw config reflects the planned split.
- Mission Control is running.
- Mission Control reports a live gateway connection.
- Mission Control contains the intended clean 7-agent roster.
- A minimal end-to-end dispatch test succeeds.
- Any remaining issues are explicitly identified.
