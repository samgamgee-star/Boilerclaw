# Boilerclaw Capabilities

This document describes the current and intended capability surface for the Boilerclaw stack.

## Core capabilities

### 1. Orchestration
- Sam acts as orchestrator, planner, decomposer, and approval gate.
- Mission Control holds the structured execution layer.
- Tasks move through staged workflow roles instead of relying on raw chat.

### 2. Specialist execution
- Coder supports builder / reviewer / QA / frontend specialist modes.
- Other persistent agents map to task families:
  - Speccer -> specs / PRDs
  - Scribe -> copy
  - Scout -> research / lead scraping
  - Archivist -> docs / sync
  - Forge -> infrastructure

### 3. Systematic task roles
Default workflow-role bindings are keyed off the primary owner agent:

- Coder -> builder: Coder, tester: Coder, reviewer: Sam
- Speccer -> builder: Speccer, tester: Sam, reviewer: Sam
- Scribe -> builder: Scribe, tester: Sam, reviewer: Sam
- Scout -> builder: Scout, tester: Sam, reviewer: Sam
- Archivist -> builder: Archivist, tester: Sam, reviewer: Sam
- Forge -> builder: Forge, tester: Sam, reviewer: Sam
- Sam -> builder: Sam, tester: Sam, reviewer: Sam

## External capability layer

### OpenClaw-native tools
- Web search
- Cron/reminders
- Session orchestration
- File operations
- Local exec
- ACP coding sessions

### Mission Control
- Task board
- Workflow templates
- Role assignments
- Activity logs
- Deliverables
- Session tracking

### Composio (planned / capability layer)
Boilerclaw treats Composio as the external-actions capability layer for SaaS and workspace integrations.

Intended use cases:
- Gmail / Google Workspace actions
- Calendar operations
- CRM / support tools
- External SaaS reads/writes triggered by agents

Design intent:
- Composio should sit behind agent workflows as a controlled capability surface.
- Sam should decide when a task needs external system interaction.
- Mission Control should track the task/workflow state; Composio should execute the external actions.
- We should prefer explicit, reviewable actions over hidden autonomous tool use.

## Current state
- Composio is part of the intended infrastructure/capability stack.
- The repo now documents Composio as a first-class capability.
- A full implementation layer (auth flow, provider wiring, action catalog, policy rules) should be added in follow-up work.

## Next logical implementation steps
1. Add environment/config fields for Composio.
2. Define which agent(s) are allowed to invoke Composio-backed actions.
3. Decide whether Composio runs through OpenClaw plugin wiring, Mission Control service adapters, or both.
4. Add auditability rules so external actions are visible in Mission Control activities.
5. Add a small first integration target (for example Gmail or Google Calendar).
