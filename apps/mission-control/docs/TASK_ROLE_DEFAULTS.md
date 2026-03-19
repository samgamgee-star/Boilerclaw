# Task Role Defaults

## Purpose
Define the default workflow-role bindings for newly created Mission Control tasks.

## Core rule
Every execution-grade task should have:
- a **builder** (or producer)
- a **tester** (or validator)
- a **reviewer** (or approver)

These are workflow roles. They do not always imply separate permanent agents.

## Current default policy
Defaults are keyed off the task's primary assigned owner agent.

### Coding
- **Builder:** Coder
- **Tester:** Coder
- **Reviewer:** Sam

Reason: Coder has internal builder/QA/reviewer modes; Sam remains the orchestration quality gate.

### Specs / PRDs
- **Builder:** Speccer
- **Tester:** Sam
- **Reviewer:** Sam

### Copywriting
- **Builder:** Scribe
- **Tester:** Sam
- **Reviewer:** Sam

### Research
- **Builder:** Scout
- **Tester:** Sam
- **Reviewer:** Sam

### Docs / Sync
- **Builder:** Archivist
- **Tester:** Sam
- **Reviewer:** Sam

### Infra
- **Builder:** Forge
- **Tester:** Sam
- **Reviewer:** Sam

### Orchestration / Sam-owned tasks
- **Builder:** Sam
- **Tester:** Sam
- **Reviewer:** Sam

## Implementation note
Mission Control currently derives defaults from the task's assigned owner agent rather than an explicit `task_family` field.
That is the v1 systematic policy.

Later, if needed, we can add an explicit `task_family` field to make defaults independent from the initial assignee.
