import { FinancialContext, GlmResponse, Language, Category } from "./types";
import {
  getUserProfile,
  getRecurringBills,
  getCategoryLimits,
  getTransactionsThisMonth,
  getGoals,
} from "./supabase";

// ── CONTEXT BUILDER ────────────────────────────────────────────────────────

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

  const byCategory: Record<string, number> = {
    food: 0, transport: 0, shopping: 0,
    entertainment: 0, bills: 0, savings: 0, others: 0,
  };
  for (const t of transactions) {
    byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
  }

  const totalSpent = Object.values(byCategory).reduce((a: number, b: number) => a + b, 0);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const projectedOverspend: Record<string, number> = {};
  const categoriesNearLimit: string[] = [];
  const categoriesOverLimit: string[] = [];

  for (const limit of limits) {
    const spent = byCategory[limit.category] ?? 0;
    const projected = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : 0;
    const overshoot = projected - limit.monthly_limit;
    if (overshoot > 0) projectedOverspend[limit.category] = Math.round(overshoot);
    const pct = spent / limit.monthly_limit;
    if (pct >= 1) categoriesOverLimit.push(limit.category);
    else if (pct >= 0.8) categoriesNearLimit.push(limit.category);
  }

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

export function buildSystemPrompt(ctx: FinancialContext): string {
  const isEn = ctx.user.language === "en";

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
        return `- ${g.name}: Target RM${g.target_amount}, Saved RM${g.saved_amount}, Monthly RM${g.monthly_contribution}, Deadline ${g.deadline} (${monthsLeft}mo left), Needs RM${requiredMonthly.toFixed(0)}/mo, Status: ${g.status}`;
      }).join("\n");

  const billsText = ctx.recurring_bills.length === 0
    ? "No recurring bills."
    : ctx.recurring_bills.map((b: any) => `- ${b.name}: RM${b.amount} (day ${b.due_day})`).join("\n");

  const limitsText = ctx.category_limits.length === 0
    ? "No category limits set."
    : ctx.category_limits.map((l: any) => {
        const spent = ctx.current_month.by_category[l.category as Category] ?? 0;
        const pct = Math.round((spent / l.monthly_limit) * 100);
        return `- ${categoryLabels[l.category]}: RM${spent} of RM${l.monthly_limit} (${pct}%)`;
      }).join("\n");

  const spendingText = Object.entries(ctx.current_month.by_category)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `- ${categoryLabels[k]}: RM${v}`)
    .join("\n");

  const flagsText = [
    ...ctx.insights_flags.categories_over_limit.map(c => `OVER LIMIT: ${categoryLabels[c]}`),
    ...ctx.insights_flags.categories_near_limit.map(c => `NEAR LIMIT (>80%): ${categoryLabels[c]}`),
    ...Object.entries(ctx.insights_flags.projected_overspend).map(
      ([c, amt]) => `PROJECTED OVERSPEND: ${categoryLabels[c]} by RM${amt} by month-end`
    ),
    ...(ctx.insights_flags.goals_at_risk.length > 0
      ? [`GOALS AT RISK: ${ctx.insights_flags.goals_at_risk.join(", ")}`]
      : []),
  ].join("\n") || "No flags — finances healthy.";

  return `You are BajetHidup's AI financial advisor — warm, direct, and non-judgmental. You help young Malaysians make smarter financial decisions.

RULES:
1. Respond in ${isEn ? "English" : "Bahasa Malaysia"} only.
2. You have read/write access to the user's financial data. You can take real action.
3. Always use real numbers from the profile below. Never invent figures.
4. Be like a smart friend, not a bank officer. Keep responses concise (mobile-first).
5. Use Malaysian context: RM, GrabFood, Shopee, TNG, PTPTN, EPF.
6. Structured outputs (ACTION, DECISION_CARD, GOAL_PREVIEW) go at the END after your conversational text, in XML-style tags.

--- FINANCIAL PROFILE ---
Monthly Income: RM${ctx.user.income}
Fixed Bills: RM${ctx.recurring_bills.reduce((s: number, b: any) => s + b.amount, 0)} | Discretionary: RM${ctx.user.discretionary}/month

RECURRING BILLS (do not suggest cutting):
${billsText}

THIS MONTH (Day ${ctx.current_month.days_elapsed}/${ctx.current_month.days_elapsed + ctx.current_month.days_remaining}):
Total Spent: RM${ctx.current_month.total_spent}
${spendingText}

LIMITS:
${limitsText}

GOALS:
${goalsText}

ALERTS:
${flagsText}

--- ACTIONS YOU CAN TAKE ---
Wrap in tags at end of your message:

<ACTION>{"type":"CREATE_GOAL","payload":{"name":"...","target_amount":0,"monthly_contribution":0,"deadline":"YYYY-MM-DD","tips":"..."}}</ACTION>
<ACTION>{"type":"SET_CATEGORY_LIMIT","payload":{"category":"food","monthly_limit":0}}</ACTION>
<ACTION>{"type":"LOG_TRANSACTION","payload":{"amount":0,"category":"food","merchant":"...","description":"...","date":"YYYY-MM-DD","raw_input":"..."}}</ACTION>
<ACTION>{"type":"UPDATE_GOAL","payload":{"id":"...","monthly_contribution":0}}</ACTION>

<DECISION_CARD>{"situation":"...","options":[{"label":"A","trade_off":"...","impact_on_goals":"..."},{"label":"B","trade_off":"...","impact_on_goals":"..."}],"recommendation":"...","recommended_index":0}</DECISION_CARD>

<GOAL_PREVIEW>{"name":"...","target_amount":0,"monthly_contribution":0,"deadline":"YYYY-MM-DD","tips":"...","suggested_category_reduction":{"category":"food","reduce_by":0}}</GOAL_PREVIEW>

DO: Be specific with numbers. Reference real categories. Offer actionable next steps.
DON'T: Generic advice. Make up numbers. Be preachy. Cut recurring bills.`;
}

// ── RESPONSE PARSER ────────────────────────────────────────────────────────

export function parseGlmResponse(rawText: string): GlmResponse {
  let message = rawText;
  let action = undefined;
  let decision_card = undefined;
  let goal_preview = undefined;

  const actionMatch = rawText.match(/<ACTION>([\s\S]*?)<\/ACTION>/);
  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1].trim());
      message = message.replace(/<ACTION>[\s\S]*?<\/ACTION>/, "").trim();
    } catch (e) {
      console.error("Failed to parse ACTION block:", e);
    }
  }

  const dcMatch = rawText.match(/<DECISION_CARD>([\s\S]*?)<\/DECISION_CARD>/);
  if (dcMatch) {
    try {
      decision_card = JSON.parse(dcMatch[1].trim());
      message = message.replace(/<DECISION_CARD>[\s\S]*?<\/DECISION_CARD>/, "").trim();
    } catch (e) {
      console.error("Failed to parse DECISION_CARD block:", e);
    }
  }

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

// ── ILMU AI CALLER ─────────────────────────────────────────────────────────
// ILMU uses the OpenAI-compatible API format.
// Docs: https://docs.ilmu.ai/docs/api/chat-completions
// Base URL: https://api.ilmu.ai/v1
// Auth: Authorization: Bearer YOUR_API_KEY
// Models: nemo-super (smart), ilmu-nemo-nano (fast)

export async function callIlmuAI(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  const baseUrl = (process.env.ZAI_BASE_URL ?? "https://api.ilmu.ai/v1").replace(/\/$/, "");
  const apiKey = process.env.ZAI_API_KEY ?? "";
  const model = process.env.ZAI_MODEL ?? "nemo-super";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ILMU AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── INSIGHT GENERATORS ─────────────────────────────────────────────────────

export async function generatePatternInsight(
  ctx: FinancialContext,
  patternType: string
): Promise<string> {
  const system = buildSystemPrompt(ctx);
  return callIlmuAI(
    [{ role: "user", content: `Analyse my spending data and explain my "${patternType}" pattern in 2-3 sentences. Be specific with numbers. End with one practical suggestion.` }],
    system
  );
}

export async function generateWeeklySummary(ctx: FinancialContext): Promise<{
  win: string;
  watch_out: string;
  one_thing: string;
}> {
  const system = buildSystemPrompt(ctx);
  const text = await callIlmuAI(
    [{ role: "user", content: `Generate this week's financial summary as JSON only (no other text):\n{"win":"...","watch_out":"...","one_thing":"..."}` }],
    system
  );
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
  const system = buildSystemPrompt(ctx);
  return callIlmuAI(
    [{ role: "user", content: `If I reduce my ${category} spending by RM${reduceBy} per month, how does that affect my goals? 1-2 sentences, specific numbers.` }],
    system
  );
}
