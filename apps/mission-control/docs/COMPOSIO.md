# Composio in Boilerclaw

## Purpose
This document defines how Composio fits into the Boilerclaw architecture.

## Role in the stack
Composio is the planned external-actions capability layer.

- **Mission Control** tracks the workflow and execution state.
- **OpenClaw** runs the agents and tools.
- **Composio** is intended to connect the system to third-party SaaS/workspace actions.

## Why Composio belongs here
Without a capability layer, agents can reason and plan but still need a controlled way to act on external systems.
Composio is the intended bridge for those actions.

## Intended responsibilities
- authenticate external integrations
- expose controlled app actions to the system
- let agents perform explicit SaaS actions when allowed
- keep the external-action layer modular instead of hardcoding one-off integrations everywhere

## Design constraints
- External actions should be auditable.
- Mission Control should reflect important action-driven workflow changes.
- Sam should remain the orchestration layer for deciding when external systems should be touched.
- We should prefer a small number of explicit, high-value integrations first.

## Good first integrations
1. Gmail
2. Google Calendar
3. Google Drive / Docs
4. HubSpot or equivalent CRM

## Suggested implementation plan
1. Add Composio config and secret wiring.
2. Decide invocation path:
   - via OpenClaw plugin wiring
   - via Mission Control-side adapter layer
   - or a hybrid model
3. Define which agent roles can invoke Composio-backed actions.
4. Log important external actions back into Mission Control activities.
5. Start with one real integration and test the review/approval model.

## Current repo state
This repo currently documents and configures Composio as a planned capability surface.
A full production integration is a follow-up implementation task.
