create extension if not exists pgcrypto;

create table if not exists automation_rules (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    metric text not null check (metric in ('roas', 'spend', 'cpc', 'cpa', 'clicks', 'impressions')),
    operator text not null check (operator in ('<', '<=', '>', '>=', '=', '==')),
    value numeric not null,
    action text not null,
    active boolean not null default true,
    requires_approval boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists action_logs (
    id uuid primary key default gen_random_uuid(),
    user_id text not null default 'system',
    campaign_id text,
    campaign_name text,
    action_suggested text not null,
    reason text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'executed', 'failed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists action_logs_status_idx on action_logs (status);
create index if not exists automation_rules_active_idx on automation_rules (active);

insert into automation_rules (name, metric, operator, value, action)
values ('Pausar campanas con ROAS bajo', 'roas', '<', 1.2, 'pause_campaign')
on conflict do nothing;
