# Claude Code Prompt: Software Engineering Agent Platform

You are Claude Code working inside my local development environment.

## Project Goal

Build an advanced portfolio project called **Software Engineering Agent Platform**.

This should be a serious agentic software delivery platform, not a simple coding chatbot.

The product should demonstrate how AI agents can take a software feature request, break it into an implementation plan, generate technical tasks, simulate code changes, create test plans, run quality gates, and produce a pull-request-style summary with human approval.

The goal is to impress AI startup recruiters and technical leads looking for someone who can build agentic systems and polished web platforms.

## Target Role Alignment

This project should strongly align with roles involving:

- agent system architecture
- full-stack TypeScript
- React / Next.js
- Supabase backend
- Railway deployment
- technical leadership
- AI-assisted engineering workflows
- customer-facing product development

## Product Concept

The app is a **control center for software engineering agents**.

A user submits a request like:

> Add a pricing page with monthly/yearly toggle and responsive cards.

The system should:

1. Understand the requirement.
2. Create an engineering plan.
3. Break the plan into agent steps.
4. Simulate implementation output.
5. Generate files/change summary.
6. Generate test plan.
7. Run quality checks.
8. Pause for human approval.
9. Produce a final PR summary.

## Important Instruction

Before writing code, inspect the current folder and determine whether this is an empty repo or an existing project.

Then create a practical implementation plan and execute it step by step.

The final project should be demo-ready and recruiter-friendly.

## Recommended Stack

Use:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase-ready persistence layer
- Zod for validation
- Optional: Vercel AI SDK or pluggable LLM adapter
- Mock mode for local demo without real API keys

Prioritize clean architecture and excellent UI.

## Core Product Flow

### User Input

User creates a software request with:

- feature title
- requirement description
- target framework: Next.js, React, Node, generic TypeScript
- complexity: small, medium, large
- risk level: low, medium, high
- acceptance criteria

### Agent Workflow

The system creates a multi-step workflow:

1. Requirement analysis
2. Architecture planning
3. Task breakdown
4. Implementation simulation
5. Test plan generation
6. Accessibility review
7. Security review
8. Performance review
9. PR summary generation
10. Human approval

## Agent Types

Model the platform as if multiple specialist agents are working together.

### Planner Agent

Responsible for:

- understanding the request
- identifying missing details
- creating implementation approach
- defining technical tasks

### Code Agent

Responsible for:

- proposing file changes
- generating component/API examples
- explaining implementation choices

### QA Agent

Responsible for:

- test cases
- edge cases
- regression risks
- accessibility checklist

### Review Agent

Responsible for:

- reviewing quality
- detecting risks
- producing approval recommendation

For v1, these agents can be simulated with deterministic functions and mock outputs. Structure the code so real LLM calls can be plugged in later.

## Runtime Engine

Create a clean runtime engine that handles:

- workflow creation
- step execution
- agent assignment
- status transitions
- retries
- errors
- logs
- human approval
- final artifact generation

Suggested folder structure:

```txt
src/lib/engineering-agent/
  types.ts
  agents/
    planner-agent.ts
    code-agent.ts
    qa-agent.ts
    review-agent.ts
  runtime.ts
  logger.ts
  quality-gates.ts
  mock-model.ts
```

## Pages / UI

Create these pages:

```txt
/
/dashboard
/requests/new
/workflows
/workflows/[id]
/artifacts/[id]
/settings
```

## Dashboard

Dashboard should show:

- total workflows
- completed workflows
- failed workflows
- waiting for approval
- average run duration
- quality score average
- recent workflows

## New Request Page

Create a polished form where the user submits a software feature request.

Fields:

- title
- description
- framework
- complexity
- risk level
- acceptance criteria

## Workflow Detail Page

This is the most important screen.

Show:

- request summary
- agent workflow timeline
- active step
- logs
- generated implementation plan
- simulated file changes
- quality gate results
- approval panel
- final PR summary

The UI should make it obvious that multiple agents are collaborating.

## Quality Gates

Add quality gate checks such as:

- TypeScript safety
- accessibility
- performance risk
- security risk
- test coverage
- maintainability

Each quality gate should have:

- status: passed, warning, failed
- score
- explanation

## Final Artifact

At the end, generate a pull-request-style artifact with:

- PR title
- summary
- implementation plan
- files changed
- testing plan
- risks
- reviewer checklist
- rollback plan

This final artifact should look useful enough to paste into GitHub.

## Observability

Each workflow should track:

- agent used per step
- status
- duration
- token estimate
- cost estimate
- logs
- retries
- quality score

This is important because real agentic engineering tools need traceability.

## Data Types

Design types for:

### EngineeringRequest

- id
- title
- description
- framework
- complexity
- riskLevel
- acceptanceCriteria
- createdAt

### AgentWorkflow

- id
- requestId
- status
- startedAt
- completedAt
- qualityScore
- estimatedCost

### WorkflowStep

- id
- workflowId
- agentName
- name
- description
- status
- output
- error
- startedAt
- completedAt

### QualityGate

- id
- workflowId
- name
- status
- score
- explanation

### WorkflowLog

- id
- workflowId
- stepId
- level
- message
- timestamp
- metadata

### PullRequestArtifact

- id
- workflowId
- title
- summary
- filesChanged
- testingPlan
- risks
- checklist
- rollbackPlan
- createdAt

## Demo Examples

Add realistic demo workflows:

1. Build pricing page with monthly/yearly toggle.
2. Add multi-step contact form with validation.
3. Refactor legacy Bootstrap component into Tailwind.
4. Add audit logging to an admin dashboard.

## README Requirements

Create a strong README with:

- project overview
- why this project exists
- architecture explanation
- multi-agent workflow explanation
- human-in-the-loop explanation
- quality gates explanation
- screenshots section placeholders
- tech stack
- local setup
- environment variables
- deployment notes
- roadmap

Include Mermaid diagrams:

1. System architecture
2. Agent workflow
3. Runtime state machine

## UI Style Direction

Make the UI feel like a serious AI engineering product.

Inspired by:

- Linear
- GitHub pull request UI
- Vercel dashboard
- LangSmith traces
- modern AI infrastructure dashboards

Avoid toy/demo styling.

## Acceptance Criteria

The project is successful when:

- It runs locally.
- User can create a software engineering request.
- System creates a multi-agent workflow.
- Workflow detail page shows timeline, logs, quality gates, and generated artifacts.
- Human approval exists before final PR artifact.
- Final artifact is clear and useful.
- Dashboard shows useful metrics.
- Code is modular and typed.
- README clearly explains architecture and value.

## Implementation Phases

### Phase 1
Set up app structure, types, mock data, and base layout.

### Phase 2
Create multi-agent runtime and mock agents.

### Phase 3
Build dashboard, new request page, and workflow list.

### Phase 4
Build workflow detail page with timeline, logs, quality gates, and approval.

### Phase 5
Generate final PR artifact and polish README.

After each phase, run checks and summarize what changed.

## Extra Polish

If time allows, add:

- workflow replay button
- retry failed step
- compare two workflow runs
- model selector
- export PR artifact as markdown
- dark mode
- command palette

## Final Output Expected From Claude Code

When finished, provide:

1. Summary of what was implemented.
2. How to run locally.
3. Key architecture decisions.
4. Important files.
5. Known limitations.
6. Suggested next improvements.
