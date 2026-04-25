# Step 4 — GLM Engine (Build This Before Any Page)

This is the most important file in the entire project.
`lib/glm.ts` is the brain. Everything else is the body.

---

## 4.1 lib/glm.ts — Full Implementation

```typescript
// lib/glm.ts
import { FinancialContext, GlmResponse, Language, Category } from "./types";
import {
  getUserProfile,
  getRecurringBills,
  getCategoryLimits,
  getTransactionsThisMonth,
  getGoals,
} from "./supabase";

// ── CONTEXT BUILDER ────────────────────────────────────────────────────────
// Assembles the full FinancialContext from live Supabase data.
// Called fresh on every GLM request — never cached.

export async function buildFinancialContext(userId: string): Promise<FinancialContext> {
  const [profile, bills, limits, transactions, goals] = await Promise.all([
    getUserProfile(userId),
    getRecurringBills(userId),
    getCategoryLimits(userId),
    getTransactionsThisMonth(userId),
    getGoals(userId),
  ]);

  const totalBills = bills.reduce((sum: number, b: any) => sum + b.amount, 0);
  const discretionary = (profile?.income ?? 0) - totalBills;

  // Aggregate spending by category
  const byCategory: Record<string, number> = {
    food: 0, transport: 0, shopping: 0,
    entertainment: 0, bills: 0, savings: 0, others: 0,
  };
  for (const t of transactions) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  const totalSpent = Object.values(byCategory).reduce((a: number, b: number) => a + b, 0);

  // Date helpers
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  // Projected month-end spend per category
  const projectedOverspend: Record<string, number> = {};
  const categoriesNearLimit: string[] = [];
  const categoriesOverLimit: string[] = [];

  for (const limit of limits) {
    const spent = byCategory[limit.category] ?? 0;
    const projected = (spent / daysElapsed) * daysInMonth;
    const overshoot = projected - limit.monthly_limit;
    if (overshoot > 0) projectedOverspend[limit.category] = Math.round(overshoot);
    const pct = spent / limit.monthly_limit;
    if (pct >= 1) categoriesOverLimit.push(limit.category);
    else if (pct >= 0.8) categoriesNearLimit.push(limit.category);
  }

  // Goal health flags
  const goalsAtRisk = goals
    .filter((g: any) => g.status === "at_risk" || g.status === "off_track")
    .map((g: any) => g.id);

  return {
    user: {
      income: profile?.income ?? 0,
      language: (profile?.language ?? "en") as Language,
      discretionary,
    },
    recurring_bills: bills,
    category_limits: limits,
    current_month: {
      total_spent: totalSpent,
      by_category: byCategory as Record<Category, number>,
      transactions,
      days_elapsed: daysElapsed,
      days_remaining: daysRemaining,
    },
    goals,
    insights_flags: {
      categories_near_limit: categoriesNearLimit as Category[],
      categories_over_limit: categoriesOverLimit as Category[],
      goals_at_risk: goalsAtRisk,
      projected_overspend: projectedOverspend as Record<Category, number>,
    },
  };
}

// ── SYSTEM PROMPT BUILDER ──────────────────────────────────────────────────
// Constructs the full GLM system prompt from live FinancialContext.
// This is what makes every response personalised.

export function buildSystemPrompt(ctx: FinancialContext): string {
  const lang = ctx.user.language;
  const isEn = lang === "en";

  const categoryLabels: Record<string, string> = isEn
    ? { food: "Food & Dining", transport: "Transport", shopping: "Shopping", entertainment: "Entertainment", bills: "Bills", savings: "Savings", others: "Others" }
    : { food: "Makanan & Minum", transport: "Pengangkutan", shopping: "Membeli-belah", entertainment: "Hiburan", bills: "Bil", savings: "Simpanan", others: "Lain-lain" };

  const goalsText = ctx.goals.length === 0
    ? "No active goals set."
    : ctx.goals.map((g: any) => {
        const monthsLeft = Math.max(1, Math.ceil(
          (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
        ));
        const remaining = g.target_amount - g.saved_amount;
        const requiredMonthly = remaining / monthsLeft;
        const onTrack = g.monthly_contribution >= requiredMonthly;
        return `- ${g.name}: Target RM${g.target_amount}, Saved RM${g.saved_amount}, ` +
          `Monthly contribution RM${g.monthly_contribution}, ` +
          `Deadline: ${g.deadline} (${monthsLeft} months), ` +
          `Needs RM${requiredMonthly.toFixed(0)}/month, Status: ${g.status}`;
      }).join("\n");

  const billsText = ctx.recurring_bills.length === 0
    ? "No recurring bills set."
    : ctx.recurring_bills.map((b: any) => `- ${b.name}: RM${b.amount} (due day ${b.due_day})`).join("\n");

  const limitsText = ctx.category_limits.length === 0
    ? "No category limits set."
    : ctx.category_limits.map((l: any) => {
        const spent = ctx.current_month.by_category[l.category as Category] ?? 0;
        const pct = Math.round((spent / l.monthly_limit) * 100);
        return `- ${categoryLabels[l.category]}: RM${spent} spent of RM${l.monthly_limit} limit (${pct}%)`;
      }).join("\n");

  const spendingText = Object.entries(ctx.current_month.by_category)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `- ${categoryLabels[k]}: RM${v}`)
    .join("\n");

  const flagsText = [
    ...ctx.insights_flags.categories_over_limit.map(c => `⚠️ OVER LIMIT: ${categoryLabels[c]}`),
    ...ctx.insights_flags.categories_near_limit.map(c => `⚡ NEAR LIMIT (>80%): ${categoryLabels[c]}`),
    ...Object.entries(ctx.insights_flags.projected_overspend).map(
      ([c, amt]) => `📈 PROJECTED OVERSPEND: ${categoryLabels[c]} by RM${amt} by month-end`
    ),
    ...(ctx.insights_flags.goals_at_risk.length > 0
      ? [`🎯 GOALS AT RISK: ${ctx.insights_flags.goals_at_risk.join(", ")}`]
      : []),
  ].join("\n") || "No flags — finances looking healthy.";

  return `You are BajetHidup's AI financial advisor — a warm, direct, and non-judgmental financial intelligence agent for young Malaysians.

CRITICAL RULES:
1. Always respond in ${isEn ? "English" : "Bahasa Malaysia"}. Never switch languages unless the user explicitly asks.
2. You have FULL READ AND WRITE ACCESS to the user's financial data. You are not just giving advice — you can take action.
3. Always reason from the actual numbers below. Never make up figures. Never use generic advice.
4. Be warm and conversational — like a smart friend, not a bank officer.
5. Use Malaysian context: ringgit (RM), local merchants (GrabFood, Shopee, TNG, etc.), local financial products (PTPTN, EPF).
6. Keep responses concise. Mobile users read on small screens.
7. When producing a Decision Card or Goal Preview, output a valid JSON block at the END of your message wrapped in <ACTION>...</ACTION> tags. Your conversational text comes BEFORE the tags.

═══════════════════════════════════════════
USER'S FINANCIAL PROFILE
═══════════════════════════════════════════

Monthly Income: RM${ctx.user.income}
Fixed Bills Total: RM${ctx.recurring_bills.reduce((s: number, b: any) => s + b.amount, 0)}
Discretionary Budget: RM${ctx.user.discretionary}/month

RECURRING BILLS (immovable — do not suggest cutting these):
${billsText}

═══════════════════════════════════════════
THIS MONTH'S SPENDING (Day ${ctx.current_month.days_elapsed} of ${ctx.current_month.days_elapsed + ctx.current_month.days_remaining})
═══════════════════════════════════════════

Total Spent: RM${ctx.current_month.total_spent}

By Category:
${spendingText}

Category Limits:
${limitsText}

═══════════════════════════════════════════
ACTIVE GOALS
═══════════════════════════════════════════

${goalsText}

═══════════════════════════════════════════
FLAGS & ALERTS
═══════════════════════════════════════════

${flagsText}

═══════════════════════════════════════════
YOUR CAPABILITIES (ACTIONS YOU CAN TAKE)
═══════════════════════════════════════════

You can take the following actions by outputting a JSON block in <ACTION>...</ACTION> tags at the end of your message.

1. CREATE_GOAL — when user agrees to add a new goal after discussion
   {"type":"CREATE_GOAL","payload":{"name":"...","target_amount":0,"monthly_contribution":0,"deadline":"YYYY-MM-DD","tips":"..."}}

2. SET_CATEGORY_LIMIT — when user asks to limit a spending category
   {"type":"SET_CATEGORY_LIMIT","payload":{"category":"food","monthly_limit":0}}

3. LOG_TRANSACTION — when user tells you about a purchase
   {"type":"LOG_TRANSACTION","payload":{"amount":0,"category":"food","merchant":"...","description":"...","date":"YYYY-MM-DD","raw_input":"..."}}

4. UPDATE_GOAL — when user wants to adjust an existing goal
   {"type":"UPDATE_GOAL","payload":{"id":"...","monthly_contribution":0}}

DECISION CARD format (use when presenting trade-off options — wrap in <DECISION_CARD>...</DECISION_CARD>):
{
  "situation": "Brief summary of the financial conflict",
  "options": [
    {"label":"Option A","trade_off":"What needs to give","impact_on_goals":"Effect on existing goals"},
    {"label":"Option B","trade_off":"...","impact_on_goals":"..."}
  ],
  "recommendation":"Which option you recommend and why in 1 sentence",
  "recommended_index": 0
}

GOAL PREVIEW format (use when presenting a goal for the user to approve — wrap in <GOAL_PREVIEW>...</GOAL_PREVIEW>):
{
  "name":"Goal name",
  "target_amount":0,
  "monthly_contribution":0,
  "deadline":"YYYY-MM-DD",
  "tips":"Your personalised tip for achieving this goal",
  "suggested_category_reduction":{"category":"food","reduce_by":0}
}

═══════════════════════════════════════════
TONE GUIDE
═══════════════════════════════════════════

✅ DO: Be specific with numbers. Be warm. Be direct. Offer options.
✅ DO: Reference actual spending data. Name the categories. Name the amounts.
✅ DO: If a goal is at risk, say so clearly and offer a fix.
✅ DO: End with an actionable next step or question.
❌ DON'T: Give generic financial advice ("spend less, save more").
❌ DON'T: Be preachy or make the user feel guilty.
❌ DON'T: Recommend cutting recurring bills — those are fixed.
❌ DON'T: Make up numbers not in the financial profile above.`;
}

// ── GLM API CALLER ─────────────────────────────────────────────────────────
// Sends messages to Z.AI GLM and returns parsed response.

export async function callGlm(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<Response> {
  const response = await fetch(`${process.env.ZAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.ZAI_MODEL ?? "glm-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  return response;
}

// ── RESPONSE PARSER ────────────────────────────────────────────────────────
// Extracts structured data from GLM's text response.
// GLM embeds actions in special tags — this pulls them out.

export function parseGlmResponse(rawText: string): GlmResponse {
  let message = rawText;
  let action = undefined;
  let decision_card = undefined;
  let goal_preview = undefined;

  // Extract ACTION block
  const actionMatch = rawText.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1].trim());
      message = message.replace(/<ACTION>[\s\S]*?<\/ACTION>/, "").trim();
    } catch (e) {
      console.error("Failed to parse ACTION block:", e);
    }
  }

  // Extract DECISION_CARD block
  const dcMatch = rawText.match(/<DECISION_CARD>([\s\S]*?)<\/DECISION_CARD>/);
  if (dcMatch) {
    try {
      decision_card = JSON.parse(dcMatch[1].trim());
      message = message.replace(/<DECISION_CARD>[\s\S]*?<\/DECISION_CARD>/, "").trim();
    } catch (e) {
      console.error("Failed to parse DECISION_CARD block:", e);
    }
  }

  // Extract GOAL_PREVIEW block
  const gpMatch = rawText.match(/<GOAL_PREVIEW>([\s\S]*?)<\/GOAL_PREVIEW>/);
  if (gpMatch) {
    try {
      goal_preview = JSON.parse(gpMatch[1].trim());
      message = message.replace(/<GOAL_PREVIEW>[\s\S]*?<\/GOAL_PREVIEW>/, "").trim();
    } catch (e) {
      console.error("Failed to parse GOAL_PREVIEW block:", e);
    }
  }

  return { message, action, decision_card, goal_preview };
}

// ── INSIGHT GENERATORS ─────────────────────────────────────────────────────
// Used by the Insights page to generate specific AI insights on demand.

export async function generatePatternInsight(
  ctx: FinancialContext,
  patternType: string
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);
  const userMessage = `Analyse my spending data and explain my "${patternType}" pattern in 2-3 sentences. Be specific with numbers. End with one practical suggestion.`;

  const res = await fetch(`${process.env.ZAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.ZAI_MODEL ?? "glm-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.6,
      max_tokens: 200,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function generateWeeklySummary(ctx: FinancialContext): Promise<{
  win: string;
  watch_out: string;
  one_thing: string;
}> {
  const systemPrompt = buildSystemPrompt(ctx);
  const userMessage = `Generate this week's financial summary in JSON format:
{
  "win": "The biggest financial win from the past 7 days (specific, positive)",
  "watch_out": "The most important risk or concern for the coming week (specific)",
  "one_thing": "One single actionable recommendation for this week (specific and achievable)"
}
Only output valid JSON. No other text.`;

  const res = await fetch(`${process.env.ZAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.ZAI_MODEL ?? "glm-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 300,
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return { win: "", watch_out: "", one_thing: "" };
  }
}

export async function generateWhatIfProjection(
  ctx: FinancialContext,
  category: Category,
  reduceBy: number
): Promise<string> {
  const systemPrompt = buildSystemPrompt(ctx);
  const userMessage = `If I reduce my ${category} spending by RM${reduceBy} per month, how does that affect my goals? Give me a 1-2 sentence specific answer with numbers.`;

  const res = await fetch(`${process.env.ZAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ZAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.ZAI_MODEL ?? "glm-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 150,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
```

---

## 4.2 app/api/chat/route.ts — The GLM Server Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildFinancialContext, buildSystemPrompt, parseGlmResponse } from "@/lib/glm";
import { executeAction } from "@/lib/actions";

export async function POST(req: NextRequest) {
  try {
    const { userId, messages } = await req.json();

    if (!userId || !messages) {
      return NextResponse.json({ error: "Missing userId or messages" }, { status: 400 });
    }

    // Build fresh financial context from live Supabase data
    const ctx = await buildFinancialContext(userId);
    const systemPrompt = buildSystemPrompt(ctx);

    // Call Z.AI GLM
    const glmResponse = await fetch(
      `${process.env.ZAI_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ZAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.ZAI_MODEL ?? "glm-4",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: false,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      }
    );

    if (!glmResponse.ok) {
      const err = await glmResponse.text();
      console.error("GLM API error:", err);
      return NextResponse.json({ error: "GLM API error" }, { status: 500 });
    }

    const glmData = await glmResponse.json();
    const rawText = glmData.choices?.[0]?.message?.content ?? "";

    // Parse structured data from response
    const parsed = parseGlmResponse(rawText);

    // Execute any action the GLM decided to take
    let actionResult = null;
    if (parsed.action) {
      actionResult = await executeAction(userId, parsed.action);
    }

    return NextResponse.json({
      message: parsed.message,
      decision_card: parsed.decision_card ?? null,
      goal_preview: parsed.goal_preview ?? null,
      action: parsed.action ?? null,
      action_result: actionResult,
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## 4.3 lib/actions.ts — All GLM Write Actions

```typescript
// lib/actions.ts
import { supabaseAdmin } from "./supabase";
import { GlmAction } from "./types";

// Central dispatcher — GLM sends an action, this executes it
export async function executeAction(
  userId: string,
  action: GlmAction
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (action.type) {
      case "CREATE_GOAL":
        return await createGoal(userId, action.payload);
      case "UPDATE_GOAL":
        return await updateGoal(userId, action.payload);
      case "SET_CATEGORY_LIMIT":
        return await setCategoryLimit(userId, action.payload);
      case "LOG_TRANSACTION":
        return await logTransaction(userId, action.payload);
      case "UPDATE_GOAL_STATUS":
        return await updateGoalStatus(userId, action.payload);
      default:
        return { success: false, error: "Unknown action type" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createGoal(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .insert({
      user_id: userId,
      name: payload.name,
      target_amount: payload.target_amount,
      monthly_contribution: payload.monthly_contribution,
      deadline: payload.deadline,
      saved_amount: 0,
      status: "on_track",
      tips: payload.tips,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function updateGoal(userId: string, payload: any) {
  const updates: any = {};
  if (payload.monthly_contribution !== undefined)
    updates.monthly_contribution = payload.monthly_contribution;
  if (payload.deadline !== undefined)
    updates.deadline = payload.deadline;
  if (payload.saved_amount !== undefined)
    updates.saved_amount = payload.saved_amount;

  const { data, error } = await supabaseAdmin
    .from("goals")
    .update(updates)
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function setCategoryLimit(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("category_limits")
    .upsert(
      {
        user_id: userId,
        category: payload.category,
        monthly_limit: payload.monthly_limit,
        set_by_ai: true,
        set_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function logTransaction(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      amount: payload.amount,
      category: payload.category,
      merchant: payload.merchant,
      description: payload.description,
      date: payload.date,
      raw_input: payload.raw_input,
      added_by_ai: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function updateGoalStatus(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .update({ status: payload.status })
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
```

---

## 4.4 app/api/actions/route.ts — Direct Action Endpoint

For when the frontend needs to trigger a GLM action directly (e.g. user taps "Add to Goals" button on a GoalPreviewCard):

```typescript
// app/api/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/actions";

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }
    const result = await executeAction(userId, action);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## Checklist Before Moving to Step 5

- [ ] `lib/glm.ts` created with all exports working
- [ ] `lib/actions.ts` created with all action handlers
- [ ] `app/api/chat/route.ts` created
- [ ] `app/api/actions/route.ts` created
- [ ] Test the chat route: POST to `/api/chat` with `{"userId":"demo-user-amirah","messages":[{"role":"user","content":"Hello, how much have I spent this month?"}]}`
- [ ] Verify GLM responds with actual financial data from the context
- [ ] Verify action parsing works (test with a goal creation message)
