# BajetHidup — Master Blueprint
> **Read this file first. Every time. Before touching any other file.**

---

## What You Are Building

**BajetHidup** is a bilingual (English / Bahasa Malaysia) personal finance decision intelligence web app for Malaysian students and young working adults (18–30).

It looks like a wallet app. It thinks like a financial advisor. It acts like an agent.

The AI (Z.AI GLM) does not just chat — it **reads and writes the user's financial data**. It creates goals, sets spending limits, logs transactions, detects conflicts, and generates personalised financial insights — all from natural conversation.

---

## The One Idea to Never Forget

> **The AI is not a chatbot bolted onto a finance app.**
> **The AI IS the finance app. Every screen is either feeding data to the AI or showing output from it.**

If you remove the GLM, BajetHidup becomes a static spreadsheet. That is the test.

---

## App Structure — 4 Pages

| Page | Route | Role |
|------|-------|------|
| Home | `/dashboard` | Daily wallet view — spending ring, category cards, AI insight card, transactions |
| Insights | `/insights` | Financial intelligence dashboard — GLM-generated charts, patterns, goals, what-if simulator |
| AI Negotiator | `/ai` | Conversational agent — chat UI where GLM reads and writes user data |
| Profile | `/profile` | Settings — income, bills, limits, language, demo mode |

---

## The Intelligence Loop

```
Home → AI Insight Card → taps → AI Page
AI Page → discusses goal → GLM creates goal → Insights Page updates
Insights Page → pattern chip → taps "Tell me more" → AI Page opens with context
AI Page → trade-off resolved → GLM sets limit → Home Category Card updates
```

This loop is the product. Every feature either feeds it or extends it.

---

## Tech Stack (Non-Negotiable)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Tremor |
| Database + Auth | Supabase |
| AI | Z.AI GLM via `/api/chat` server route |
| Hosting | Vercel |

---

## Build Order (Follow This Exactly)

Build in this sequence. Each step depends on the previous.

```
Step 1 → 01_tech_setup.md      — Init project, install deps, configure env
Step 2 → 02_database.md        — Create Supabase schema, run seed SQL
Step 3 → 09_demo_data.md       — Seed Amirah's demo data
Step 4 → 03_glm_engine.md      — Build /lib/glm.ts and /api/chat route FIRST
Step 5 → 08_components.md      — Build all shared components
Step 6 → 04_page_home.md       — Build Home page
Step 7 → 05_page_insights.md   — Build Insights page
Step 8 → 06_page_ai.md         — Build AI Negotiator page
Step 9 → 07_page_profile.md    — Build Profile page
Step 10 → 10_pitch_checklist.md — QA before demo
```

> **Do not skip Step 4.** The GLM engine must exist before any page is built. Pages import from `lib/glm.ts` and `lib/actions.ts`.

---

## Environment Variables Required

Create `.env.local` at project root:

```env
# Z.AI GLM
ZAI_API_KEY=your_zai_api_key_here
ZAI_BASE_URL=https://api.z.ai/v1
ZAI_MODEL=glm-4

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> `ZAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only. Never prefix with `NEXT_PUBLIC_`.

---

## Design Language

- **Aesthetic:** Notion meets Monzo. Clean whites, soft card shadows, single green accent.
- **Primary colour:** `#16A34A` (Tailwind `green-600`)
- **Font:** System font stack (Inter via Tailwind default)
- **Feel:** Calm, trustworthy, not overwhelming. Data should reassure, not alarm.
- **Mobile-first:** All layouts designed for 390px width first, responsive up.

---

## Primary Persona — Amirah

Every feature is evaluated against: **"Does this help Amirah?"**

- Age 24, Junior Marketing Executive, Petaling Jaya
- Take-home: RM2,800/month
- Fixed bills: Rent RM750, PTPTN RM200, Phone RM80, Spotify RM17 = RM1,047
- Discretionary: ~RM1,753/month
- Goals: Laptop (RM2,400, 4 months), Bali holiday (RM2,000, 7 months)
- Pain: Knows she overspends. Doesn't know what to actually change.

---

## Key Rules for the AI Coder

1. **All Z.AI calls go through `/app/api/chat/route.ts` only** — never call the API from client components
2. **Rebuild the GLM system prompt on every call** — never cache it
3. **All DB writes from GLM go through `/lib/actions.ts`** — never write to Supabase directly from the chat route
4. **Use Supabase Realtime** for live dashboard updates when GLM writes data
5. **Every GLM response is either plain text OR a structured JSON action payload** — the chat route must parse both
6. **Language is stored in user profile** — GLM always responds in the user's chosen language
7. **Demo mode** uses a separate Supabase user ID (`demo-user-amirah`) — toggling demo mode switches the active user ID in context, never deletes data

---

## File Structure to Create

```
bajet-hidup/
├── .env.local
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← redirect to /dashboard or /onboarding
│   ├── onboarding/
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── [category]/
│   │       └── page.tsx
│   ├── insights/
│   │   └── page.tsx
│   ├── ai/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts            ← Z.AI GLM server route
│       └── actions/
│           └── route.ts            ← GLM write actions endpoint
├── components/
│   ├── ui/                         ← shadcn components (auto-generated)
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── AppShell.tsx
│   ├── home/
│   │   ├── HealthRing.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── InsightCard.tsx
│   │   ├── TransactionFeed.tsx
│   │   └── QuickAddSheet.tsx
│   ├── insights/
│   │   ├── TodayVsYesterday.tsx
│   │   ├── WeeklyTrend.tsx
│   │   ├── CategoryIntelligence.tsx
│   │   ├── GoalProgress.tsx
│   │   ├── SavingsVelocity.tsx
│   │   ├── PatternChips.tsx
│   │   ├── WhatIfSimulator.tsx
│   │   ├── BurnRate.tsx
│   │   └── WeeklySummaryCard.tsx
│   └── ai/
│       ├── ChatBubble.tsx
│       ├── DecisionCard.tsx
│       ├── GoalPreviewCard.tsx
│       └── ContextBar.tsx
├── lib/
│   ├── glm.ts                      ← system prompt builder + GLM caller
│   ├── actions.ts                  ← all GLM write actions
│   ├── supabase.ts                 ← Supabase client + typed queries
│   └── types.ts                    ← shared TypeScript types
└── hooks/
    ├── useTransactions.ts
    ├── useGoals.ts
    └── useInsights.ts
```
