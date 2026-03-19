# Boilerclaw

Boilerclaw is an umbrella repo for the current OpenClaw + Mission Control operating setup.

## Included

- `agents/sam/` — Sam's orchestrator workspace, planning docs, memory, and Mission Control routing notes
- `agents/coder/` — Coder's operating docs, memory, and specialist workflow/schema
- `apps/mission-control/` — Mission Control app source with systematic default task-role assignment logic

## Current workflow model

Mission Control tasks are treated as structured operational records derived from conversations and project docs.

Default role policy currently maps by primary owner agent:

- Coder -> builder: Coder, tester: Coder, reviewer: Sam
- Speccer -> builder: Speccer, tester: Sam, reviewer: Sam
- Scribe -> builder: Scribe, tester: Sam, reviewer: Sam
- Scout -> builder: Scout, tester: Sam, reviewer: Sam
- Archivist -> builder: Archivist, tester: Sam, reviewer: Sam
- Forge -> builder: Forge, tester: Sam, reviewer: Sam
- Sam -> builder: Sam, tester: Sam, reviewer: Sam

## Notes

This repo is a clean snapshot/export of the current working system, not a literal mirror of every local runtime artifact.
Runtime caches, databases, logs, and auth files are intentionally excluded.
