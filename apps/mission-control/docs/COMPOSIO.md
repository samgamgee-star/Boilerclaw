# Composio in Boilerclaw

## Purpose
This document defines how Composio fits into the Boilerclaw architecture
and tracks what has been implemented versus what remains.

## Role in the stack
Composio is the external-actions capability layer.

- **Mission Control** tracks the workflow and execution state.
- **OpenClaw** runs the agents and tools.
- **Composio** connects the system to third-party SaaS/workspace actions.

## Why Composio belongs here
Without a capability layer, agents can reason and plan but still need a
controlled way to act on external systems.
Composio is the intended bridge for those actions.

## Intended responsibilities
- Authenticate external integrations.
- Expose controlled app actions to the system.
- Let agents perform explicit SaaS actions when allowed.
- Keep the external-action layer modular instead of hardcoding one-off
  integrations everywhere.

## Design constraints
- External actions must be auditable.
- Mission Control should reflect important action-driven workflow changes.
- Sam remains the orchestration layer for deciding when external systems
  should be touched.
- Prefer a small number of explicit, high-value integrations first.
- Write actions default to requiring approval (COMPOSIO_REQUIRE_APPROVAL=true).

## First integration target: Notion

Notion is the first provider this system is being built to support.
It is the canonical example across the registry, policy, config, and adapter.

Rationale:
- Notion is already the primary workspace/knowledge base in use.
- Read actions (search, get page, query database) are low-risk and immediately
  useful for agents that need to look up context.
- Write actions (create page, update page) are higher-risk and default to
  requiring approval, matching the conservative default posture.

Planned action coverage:

| Action | Category | Approval |
|---|---|---|
| `NOTION_SEARCH` | read | no |
| `NOTION_GET_PAGE` | read | no |
| `NOTION_GET_DATABASE` | read | no |
| `NOTION_QUERY_DATABASE` | read | no |
| `NOTION_CREATE_PAGE` | write | yes |
| `NOTION_UPDATE_PAGE` | write | yes |

**None of these are wired yet.** This is honest scaffolding.
The connected account ID goes in `COMPOSIO_NOTION_CONNECTED_ACCOUNT_ID`
once the Notion integration is set up in the Composio dashboard.

Follow-on targets (planned, not yet scaffolded): Gmail, Google Calendar,
Google Drive.

---

## Current implementation state (as of add-composio branch)

### What exists

| File | Purpose |
|---|---|
| `src/lib/composio-config.ts` | Typed server-side accessors for all Composio env vars (`getComposioConfig`, `isComposioEnabled`, `assertComposioReady`). Includes `notionConnectedAccountId` for the first integration target. |
| `src/lib/composio-policy.ts` | Role allowlist + per-action policies. `canInvokeAction(role, action)` is the main gate. Notion actions are listed first. |
| `src/lib/composio/registry.ts` | Static provider/action manifest. Notion is the first registered provider; Gmail, Google Calendar, Google Drive are planned follow-ons. |
| `src/lib/composio/adapter.ts` | Invocation interface + stub `invokeComposioAction()` + `auditComposioInvocation()` placeholder. |
| `src/lib/composio-policy.test.ts` | Unit tests for all policy gates (node:test, no external test framework). Includes Notion-specific tests. |
| `.env.example` | `COMPOSIO_ENABLED`, `COMPOSIO_API_KEY`, `COMPOSIO_BASE_URL`, `COMPOSIO_CONNECTED_ACCOUNT_ID`, `COMPOSIO_NOTION_CONNECTED_ACCOUNT_ID`, `COMPOSIO_REQUIRE_APPROVAL` documented. |

### What is stubbed / not yet production-ready

- `invokeComposioAction()` always throws `not_implemented`. No real SDK call.
- `auditComposioInvocation()` logs to console only. Not yet writing to the
  events table (see `task-governance.ts → auditBoardOverride` for the pattern).
- No API route exposes Composio actions to agents yet.
- No approval workflow is implemented. `requiresApproval` is declared in policy
  but there is no enforcement mechanism yet.
- SDK package (`composio-core`) is NOT installed.

---

## Role/action policy summary

### Top-level allowlist
Only these roles may invoke *any* Composio action:

| Role | Rationale |
|---|---|
| `master` | Sam — primary orchestrator, full access |
| `senior` | Senior specialist — read-only actions permitted |
| `scout` | Scout — read/search actions only |

All other roles (`builder`, `tester`, `reviewer`, `fixer`, etc.) are denied
at the top level.

### Per-action policies (current)

**Notion (first integration target)**

| Action | Provider | Allowed roles | Requires approval |
|---|---|---|---|
| `NOTION_SEARCH` | notion | master, senior, scout | no |
| `NOTION_GET_PAGE` | notion | master, senior, scout | no |
| `NOTION_GET_DATABASE` | notion | master, senior, scout | no |
| `NOTION_QUERY_DATABASE` | notion | master, senior, scout | no |
| `NOTION_CREATE_PAGE` | notion | master | yes |
| `NOTION_UPDATE_PAGE` | notion | master | yes |

**Planned follow-on providers**

| Action | Provider | Allowed roles | Requires approval |
|---|---|---|---|
| `GMAIL_SEND_EMAIL` | gmail | master | yes |
| `GMAIL_FETCH_EMAILS` | gmail | master, senior, scout | no |
| `GOOGLECALENDAR_CREATE_EVENT` | googlecalendar | master | yes |
| `GOOGLECALENDAR_LIST_EVENTS` | googlecalendar | master, senior, scout | no |
| `GOOGLEDRIVE_UPLOAD_FILE` | googledrive | master | yes |
| `GOOGLEDRIVE_LIST_FILES` | googledrive | master, senior, scout | no |

---

## Remaining implementation steps

1. **Connect Notion in Composio dashboard**: Create the Notion integration,
   obtain the connected account ID, set `COMPOSIO_NOTION_CONNECTED_ACCOUNT_ID`.
2. **Wire the SDK**: `npm install composio-core`, then implement
   `invokeComposioAction()` in `src/lib/composio/adapter.ts`.
3. **Persist audit events**: Replace `console.log` in `auditComposioInvocation()`
   with an INSERT into the `events` table (follow `auditBoardOverride` pattern).
4. **Build an approval flow**: When `actionRequiresApproval(action)` is true,
   queue the request for Sam review rather than dispatching immediately.
5. **Expose an API route**: Add a Mission Control API endpoint (e.g.
   `POST /api/composio/invoke`) that agents can call, protected by
   `canInvokeAction` and the approval gate.
6. **Test one real integration end-to-end**: `NOTION_SEARCH` or `NOTION_GET_PAGE`
   are the lowest-risk first targets (read-only, no approval needed for
   master/senior/scout).
7. **Log back to Mission Control**: After a Composio action completes,
   call `logActivity()` from `orchestration.ts` to surface it in the task feed.

---

## Invocation path (target design, not yet implemented)

```
Agent (master/senior/scout)
  → POST /api/composio/invoke  { action, provider, params, taskId }
      → canInvokeAction(role, action)          ← policy gate
      → actionRequiresApproval(action)         ← approval check
          → if true: queue for Sam approval
          → if false: invokeComposioAction()   ← adapter (stub → real SDK)
              → auditComposioInvocation()      ← audit hook
              → logActivity(taskId, ...)       ← Mission Control feed
```
