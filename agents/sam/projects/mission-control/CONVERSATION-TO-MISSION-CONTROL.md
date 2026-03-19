# Conversation → Project Docs → Mission Control

## Purpose
Define what from Felipe/Sam conversations should appear in Mission Control, and how Sam should convert source material like PRDs into operational work.

## Core principle
Mission Control should display the **execution layer**, not the raw transcript.

Do **not** send raw chat, brainstorming fragments, or every clarification into Mission Control.
Instead, Sam should convert conversations into structured artifacts and tracked work.

## Three layers

### 1. Conversation layer
What lives here:
- brainstorming
- clarifying questions
- rough ideas
- tradeoff discussion
- reactions and course-corrections

This is messy by design. It is not the board.

### 2. Project-doc layer
What lives here:
- `projects/<slug>/SPEC.md`
- `projects/<slug>/PLAN.md`
- `projects/<slug>/NOTES.md`
- `projects/<slug>/deliverables/`

This is where Sam distills conversation into stable project context.

### 3. Mission Control layer
What lives here:
- project-linked task cards
- owner assignments
- task status/stage
- dependencies
- blockers
- deliverables
- review/test/approval results

This is the operational view.

## Intake rules for Sam

When Felipe says something, Sam should classify it as one of these:

### A. Conversation only
Examples:
- "what do you think about this?"
- loose ideation
- strategy discussion without a committed next step

Action:
- keep in chat
- optionally record durable decisions in `NOTES.md` or `MEMORY.md`
- do **not** create a Mission Control item yet

### B. Project artifact
Examples:
- PRD markdown
- product brief
- design notes
- architectural direction

Action:
- save or update `SPEC.md`, `PLAN.md`, or `NOTES.md`
- use this as source material for later decomposition

### C. Execution-grade work
A thing is execution-grade if it has:
- a clear owner
- a clear output
- a clear status
- a clear definition of done

Action:
- create a Mission Control task

## Recommended decomposition flow

### Step 1: user provides source material
Example:
- PRD written by Speccer
- markdown brief from Felipe
- design notes in chat

### Step 2: Sam establishes project source of truth
Write/update:
- `projects/<slug>/SPEC.md`
- `projects/<slug>/PLAN.md`
- `projects/<slug>/NOTES.md` when needed

### Step 3: Sam decomposes into execution briefs
Do **not** create many mini-PRDs unless they are truly needed.
Prefer:
- one main spec
- one plan
- many execution briefs/tasks

### Step 4: Sam publishes only operational items to Mission Control
These are the task cards and their lifecycle metadata.

## What should be shown in Mission Control

### Always include
- `project`
- `title`
- `ownerAgent`
- `taskType`
- `complexity`
- `priority`
- `status`
- `primaryMode`
- `needsReview`
- `needsQA`
- `context`
- `expectedOutput`
- `acceptanceCriteria`
- `dependencies`
- deliverable references
- blocker state
- review / QA / approval outcome

### Sometimes include
- milestone
- due date
- major project decisions
- major risks

### Usually exclude
- raw chat messages
- tentative brainstorming
- repeated clarifications
- emotional context
- idle speculation
- implementation chatter that does not change execution state

## Sam’s task-writing standard

Every Mission Control task should be derived from project docs and should include at least:

```yaml
title: <verb + outcome>
ownerAgent: <top-level owner>
taskType: feature|bug|refactor|review|qa|spike
complexity: quick|medium|deep
priority: low|normal|high|urgent
status: backlog|ready|building|review|qa|done|blocked|canceled
primaryMode: builder|frontend|backend
needsReview: true|false
needsQA: true|false
project: <slug>
context: <why this task exists>
expectedOutput: <what should be produced>
acceptanceCriteria:
  - <done condition>
```

Helpful optional fields:
- `problem`
- `inputs`
- `constraints`
- `paths`
- `writeTarget`
- `blockedBy`
- `notes`

## Current Sam + Coder testing model

For the first implementation pass, use only:
- **Sam** for intake, decomposition, stage control, and approval logic
- **Coder** as the single coding owner

Inside `coder`, specialist modes are internal execution roles:
- `builder`
- `reviewer`
- `qa`
- `frontend`
- optional `backend`

These should not appear as separate top-level permanent agents yet unless repeated testing proves they deserve promotion.

## How to represent tester / reviewer / approver right now

Mission Control already has workflow concepts for staged roles like Builder, Tester, Reviewer, Verifier/Approver, Learner.
For our current setup, use them like this:

| Mission Control concept | Current implementation |
|---|---|
| Builder | `coder` in `builder` or `frontend` mode |
| Tester | `coder` in `qa` mode |
| Reviewer | `coder` in `reviewer` mode |
| Approver / Verifier | `sam` as orchestrator approval gate |
| Learner | not formalized yet |

This lets us test the workflow without creating new permanent agents.

## Important distinction: roles vs agents

Do **not** confuse these two:

- **Role** = a workflow responsibility inside Mission Control
- **Agent** = an actual persistent OpenClaw session/persona

For now:
- `tester`, `reviewer`, and `approver` should be treated as **workflow roles**
- execution can still be handled by Sam + Coder
- sub-agents should be registered as task-linked sessions, not promoted to standalone agents prematurely

## How to describe sub-agents now

Mission Control’s current sub-agent registration schema is minimal:

```json
{
  "openclaw_session_id": "unique-session-id",
  "agent_name": "Designer|Developer|Researcher|Writer"
}
```

That means the clean move right now is:
1. keep the real persistent owner agent simple (`sam`, `coder`)
2. when a spawned helper session is used, register it as a sub-agent with a descriptive `agent_name`
3. use the task card and activity log to explain the role it played

### Recommended naming pattern for sub-agents
Use descriptive role-first names like:
- `Coder / Builder`
- `Coder / Frontend Specialist`
- `Coder / QA Tester`
- `Coder / Reviewer`
- `Sam / Approver`

If the UI or schema prefers shorter names, use:
- `Builder`
- `Frontend Tester`
- `QA Tester`
- `Reviewer`
- `Approver`

## Recommended v1 mapping for tester / approver / reviewer

If Mission Control asks for workflow role descriptions, define them this way:

### Tester
- **Purpose:** validate behavior against acceptance criteria
- **Current executor:** `coder` in QA mode
- **Input:** task context, deliverables, acceptance criteria
- **Output:** pass/fail, scenarios tested, defects found
- **On fail:** send back to Builder

### Reviewer
- **Purpose:** inspect implementation quality and correctness
- **Current executor:** `coder` in Reviewer mode
- **Input:** code changes, deliverables, original task
- **Output:** approved / changes requested, findings grouped by severity
- **On fail:** send back to Builder

### Approver / Verifier
- **Purpose:** final confirmation that the task satisfies the original ask
- **Current executor:** `sam`
- **Input:** task card, deliverables, review/QA findings, original project context
- **Output:** approve to done or send back with clarification
- **On fail:** return to Builder or back to planning depending on problem type

## Recommended operating rule
For now, do **not** create 2–3 new permanent agents just because Mission Control has role slots.
Instead:
- define the workflow roles in Mission Control
- map them onto Sam + Coder
- register helper runs as sub-agents when needed
- only promote a role into a permanent agent after repeated real usage proves it should exist

## Graduation rule: when a role becomes a real agent
Promote a workflow role into its own persistent agent only if:
- it is used frequently across projects
- it has a clearly distinct skillset
- it benefits from its own memory/instructions
- it creates less overhead than it adds

Examples that may deserve promotion later:
- dedicated QA agent
- dedicated security reviewer
- dedicated visual/frontend reviewer

## v1 test plan
1. Felipe provides or confirms a project brief/PRD
2. Sam writes/updates project docs in `projects/<slug>/`
3. Sam creates 1–2 Mission Control tasks from those docs
4. Sam assigns `coder` as owner
5. Sam/Coder run through build → review → qa
6. Sam acts as final approver
7. Record friction before adding more agent roles

## Bottom line
Mission Control should show the structured operational records extracted from conversation, not the conversation itself.

For now, use:
- projects as source-of-truth containers
- Sam as decomposer/orchestrator/approver
- Coder as execution owner with internal specialist modes
- tester/reviewer/approver as workflow roles first, not permanent agents first
