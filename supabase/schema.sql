-- Forge — Software Engineering Agent Platform
-- Postgres / Supabase schema for the production storage adapter.
--
-- Every agent output, gate, log and artifact is already JSON-serializable in
-- the app, so structured payloads land in `jsonb` columns unchanged. Enums are
-- modeled as text + CHECK constraints to stay in lock-step with the TS unions.

create extension if not exists "pgcrypto";

create table if not exists requests (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text not null,
  framework           text not null check (framework in ('nextjs','react','node','typescript')),
  complexity          text not null check (complexity in ('small','medium','large')),
  risk_level          text not null check (risk_level in ('low','medium','high')),
  acceptance_criteria jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create table if not exists workflows (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references requests(id) on delete cascade,
  status          text not null check (status in
                    ('queued','running','awaiting_approval','approved','completed','failed','rejected')),
  quality_score   int not null default 0,
  tokens_estimate int not null default 0,
  estimated_cost  numeric(12,6) not null default 0,
  approval        jsonb,
  artifact_id     uuid,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists workflow_steps (
  id               uuid primary key default gen_random_uuid(),
  workflow_id      uuid not null references workflows(id) on delete cascade,
  kind             text not null,
  agent_name       text not null check (agent_name in ('planner','code','qa','review')),
  name             text not null,
  description      text not null,
  status           text not null check (status in ('pending','running','succeeded','failed','skipped')),
  output           jsonb,
  error            text,
  tokens_estimate  int not null default 0,
  cost_estimate    numeric(12,6) not null default 0,
  attempts         int not null default 0,
  started_at       timestamptz,
  completed_at     timestamptz,
  position         int not null
);

create table if not exists quality_gates (
  id          uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  name        text not null,
  status      text not null check (status in ('passed','warning','failed')),
  score       int not null,
  explanation text not null
);

create table if not exists workflow_logs (
  id          uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references workflows(id) on delete cascade,
  step_id     uuid references workflow_steps(id) on delete set null,
  level       text not null check (level in ('debug','info','warn','error')),
  message     text not null,
  metadata    jsonb,
  timestamp   timestamptz not null default now()
);

create table if not exists pr_artifacts (
  id                  uuid primary key default gen_random_uuid(),
  workflow_id         uuid not null references workflows(id) on delete cascade,
  title               text not null,
  summary             text not null,
  implementation_plan jsonb not null default '[]'::jsonb,
  files_changed       jsonb not null default '[]'::jsonb,
  testing_plan        jsonb not null default '[]'::jsonb,
  risks               jsonb not null default '[]'::jsonb,
  reviewer_checklist  jsonb not null default '[]'::jsonb,
  rollback_plan       jsonb not null default '[]'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists idx_workflows_request on workflows(request_id);
create index if not exists idx_workflows_status on workflows(status);
create index if not exists idx_steps_workflow on workflow_steps(workflow_id, position);
create index if not exists idx_gates_workflow on quality_gates(workflow_id);
create index if not exists idx_logs_workflow on workflow_logs(workflow_id, timestamp);

-- Convenience view backing the workflow list / dashboard.
create or replace view workflow_summary as
select
  w.id,
  w.request_id,
  r.title,
  r.framework,
  r.complexity,
  r.risk_level,
  w.status,
  w.quality_score,
  w.estimated_cost,
  w.tokens_estimate,
  extract(epoch from (w.completed_at - w.started_at)) * 1000 as duration_ms,
  w.created_at
from workflows w
join requests r on r.id = w.request_id;
