# Mission Control — Coder specialist stack

## Core principle
Coder stays the single accountable owner for delivery. Specialist modes are execution lenses, not separate bosses.

## Specialist modes
- `builder` — default implementation mode
- `reviewer` — correctness, maintainability, regression review
- `qa` — acceptance-criteria and behavior validation
- `frontend` — UI, UX, responsiveness, accessibility focus
- `backend` — optional heavier API/data/system focus when needed

## Stage model
- `backlog`
- `ready`
- `building`
- `review`
- `qa`
- `done`
- `blocked`
- `canceled`

## Dispatch rules
- Task creation should not auto-run the full chain.
- `building` dispatches the primary mode (`builder`, `frontend`, or `backend`).
- `review` dispatches only when `needsReview=true`.
- `qa` dispatches only when `needsQA=true`.
- `done` requires build completion plus passed/skipped review and QA.

## Default routing
- tiny fix: builder only
- medium feature: builder -> reviewer -> QA if user-facing
- UI-heavy task: frontend -> reviewer -> QA
- backend/API change: builder or backend -> reviewer -> QA

## Task hygiene
Before building, a task should have:
- clear title
- context
- expected output
- acceptance criteria
- relevant paths/inputs when available

If these are missing, ask for clarification or keep the task in scoping/ready instead of executing blindly.
