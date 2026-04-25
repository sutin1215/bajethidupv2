# Step 2 — Database Schema (Supabase)

Run all SQL in the Supabase SQL Editor in order.

---

## 2.1 Enable Extensions

```sql
-- Run this first
create extension if not exists "uuid-ossp";
```

---

## 2.2 Create All Tables

```sql
-- ── USERS ─────────────────────────────────────────────────────────────────
create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  income        numeric(10,2) not null default 0,
  language      text not null default 'en' check (language in ('en', 'bm')),
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── RECURRING BILLS ───────────────────────────────────────────────────────
create table public.recurring_bills (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  name          text not null,
  amount        numeric(10,2) not null,
  due_day       integer not null check (due_day between 1 and 31),
  created_at    timestamptz not null default now()
);

-- ── CATEGORY LIMITS ───────────────────────────────────────────────────────
create table public.category_limits (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  category      text not null check (category in ('food','transport','shopping','entertainment','bills','savings','others')),
  monthly_limit numeric(10,2) not null,
  set_by_ai     boolean not null default false,
  set_at        timestamptz not null default now(),
  unique(user_id, category)
);

-- ── TRANSACTIONS ──────────────────────────────────────────────────────────
create table public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  amount        numeric(10,2) not null,
  category      text not null check (category in ('food','transport','shopping','entertainment','bills','savings','others')),
  merchant      text not null default '',
  description   text not null default '',
  date          date not null default current_date,
  raw_input     text,
  added_by_ai   boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── GOALS ─────────────────────────────────────────────────────────────────
create table public.goals (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.users(id) on delete cascade,
  name                 text not null,
  target_amount        numeric(10,2) not null,
  saved_amount         numeric(10,2) not null default 0,
  monthly_contribution numeric(10,2) not null default 0,
  deadline             date not null,
  status               text not null default 'on_track' check (status in ('on_track','at_risk','off_track')),
  tips                 text,
  created_at           timestamptz not null default now()
);

-- ── AI CONVERSATIONS ──────────────────────────────────────────────────────
create table public.ai_conversations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  messages      jsonb not null default '[]',
  summary       text,
  created_at    timestamptz not null default now()
);

-- ── INSIGHTS CACHE ────────────────────────────────────────────────────────
create table public.insights_cache (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  type          text not null check (type in ('weekly_summary','pattern_labels','category_insights')),
  content       jsonb not null default '{}',
  generated_at  timestamptz not null default now()
);
```

---

## 2.3 Create Indexes

```sql
-- Transactions: most queries filter by user_id + date
create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_user_category on public.transactions(user_id, category);

-- Goals: filter by user
create index idx_goals_user on public.goals(user_id);

-- Recurring bills: filter by user
create index idx_bills_user on public.recurring_bills(user_id);

-- Insights cache: filter by user + type
create index idx_insights_user_type on public.insights_cache(user_id, type);
```

---

## 2.4 Enable Row Level Security

```sql
-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.recurring_bills enable row level security;
alter table public.category_limits enable row level security;
alter table public.transactions enable row level security;
alter table public.goals enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.insights_cache enable row level security;

-- For hackathon: permissive policies (tighten post-launch)
-- Users can read/write their own data
create policy "users_own_data" on public.users
  for all using (true) with check (true);

create policy "bills_own_data" on public.recurring_bills
  for all using (true) with check (true);

create policy "limits_own_data" on public.category_limits
  for all using (true) with check (true);

create policy "transactions_own_data" on public.transactions
  for all using (true) with check (true);

create policy "goals_own_data" on public.goals
  for all using (true) with check (true);

create policy "conversations_own_data" on public.ai_conversations
  for all using (true) with check (true);

create policy "insights_own_data" on public.insights_cache
  for all using (true) with check (true);
```

---

## 2.5 Enable Realtime

In Supabase Dashboard → Database → Replication, enable Realtime for these tables:
- `transactions`
- `goals`
- `category_limits`
- `insights_cache`

This allows the Home dashboard and Insights page to update live when GLM writes data.

---

## 2.6 Useful Database Views (Optional but Recommended)

```sql
-- Monthly spending by category for a user
create or replace view public.monthly_category_totals as
select
  user_id,
  date_trunc('month', date) as month,
  category,
  sum(amount) as total,
  count(*) as transaction_count
from public.transactions
group by user_id, date_trunc('month', date), category;

-- Daily spending for a user (last 30 days)
create or replace view public.daily_totals as
select
  user_id,
  date,
  sum(amount) as total,
  count(*) as transaction_count
from public.transactions
where date >= current_date - interval '30 days'
group by user_id, date
order by date desc;
```

---

## 2.7 Verify Schema

Run this to confirm all tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected output:
```
ai_conversations
category_limits
goals
insights_cache
recurring_bills
transactions
users
```

---

## Checklist Before Moving to Step 3

- [ ] All 7 tables created without errors
- [ ] All indexes created
- [ ] RLS enabled on all tables
- [ ] Realtime enabled for transactions, goals, category_limits, insights_cache
- [ ] Views created (optional)
- [ ] Schema verified with select query
