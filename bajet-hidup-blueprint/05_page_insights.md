# Step 7 — Page 2: Insights (Financial Intelligence Dashboard)

Route: `/insights`

---

## What This Page Does

This is not a goal list. It is a living, AI-generated financial intelligence report about the user.
Every section is visual + a "Tell me more" button that opens the AI page with that topic pre-loaded.
The user discovers things about themselves without knowing what to ask.

**Sections top to bottom:**
1. Today vs Yesterday bar comparison
2. Weekly Spending Trend (7-day line)
3. Category Intelligence Cards
4. Goal Progress & Health
5. Savings Velocity Projection
6. Spending Pattern Chips
7. What-If Simulator (interactive slider → GLM recalculates)
8. Monthly Burn Rate
9. Weekly Summary Card (GLM-written, every Monday)

---

## app/insights/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import TodayVsYesterday from "@/components/insights/TodayVsYesterday";
import WeeklyTrend from "@/components/insights/WeeklyTrend";
import CategoryIntelligence from "@/components/insights/CategoryIntelligence";
import GoalProgress from "@/components/insights/GoalProgress";
import SavingsVelocity from "@/components/insights/SavingsVelocity";
import PatternChips from "@/components/insights/PatternChips";
import WhatIfSimulator from "@/components/insights/WhatIfSimulator";
import BurnRate from "@/components/insights/BurnRate";
import WeeklySummaryCard from "@/components/insights/WeeklySummaryCard";

const USER_ID = "demo-user-amirah";

export default function InsightsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("insights-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "goals",
        filter: `user_id=eq.${USER_ID}`,
      }, loadData)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "transactions",
        filter: `user_id=eq.${USER_ID}`,
      }, loadData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [txRes, goalsRes, limRes, userRes] = await Promise.all([
      supabase.from("transactions").select("*")
        .eq("user_id", USER_ID)
        .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
        .order("date", { ascending: true }),
      supabase.from("goals").select("*").eq("user_id", USER_ID),
      supabase.from("category_limits").select("*").eq("user_id", USER_ID),
      supabase.from("users").select("income").eq("id", USER_ID).single(),
    ]);

    setTransactions(txRes.data ?? []);
    setGoals(goalsRes.data ?? []);
    setLimits(limRes.data ?? []);
    setIncome(userRes.data?.income ?? 0);
    setLoading(false);
  }

  return (
    <AppShell activeTab="insights">
      <div className="px-4 pt-6 pb-24 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-generated from your real spending</p>
        </div>

        <TodayVsYesterday transactions={transactions} loading={loading} />
        <WeeklyTrend transactions={transactions} loading={loading} />
        <CategoryIntelligence transactions={transactions} limits={limits} userId={USER_ID} loading={loading} />
        <GoalProgress goals={goals} userId={USER_ID} loading={loading} />
        <SavingsVelocity goals={goals} income={income} loading={loading} />
        <PatternChips transactions={transactions} userId={USER_ID} loading={loading} />
        <WhatIfSimulator limits={limits} goals={goals} userId={USER_ID} />
        <BurnRate transactions={transactions} limits={limits} income={income} loading={loading} />
        <WeeklySummaryCard userId={USER_ID} />
      </div>
    </AppShell>
  );
}
```

---

## components/insights/TodayVsYesterday.tsx

```tsx
"use client";
import { BarChart } from "@tremor/react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { SectionCard } from "./SectionCard";

export default function TodayVsYesterday({ transactions, loading }: any) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todayTotal = transactions
    .filter((t: any) => t.date === today)
    .reduce((s: number, t: any) => s + t.amount, 0);
  const yesterdayTotal = transactions
    .filter((t: any) => t.date === yesterday)
    .reduce((s: number, t: any) => s + t.amount, 0);

  const diff = todayTotal - yesterdayTotal;
  const diffText = diff > 0
    ? `RM${diff.toFixed(0)} more than yesterday`
    : diff < 0
    ? `RM${Math.abs(diff).toFixed(0)} less than yesterday`
    : "Same as yesterday";

  const data = [
    { day: "Yesterday", "Spent (RM)": yesterdayTotal },
    { day: "Today", "Spent (RM)": todayTotal },
  ];

  return (
    <SectionCard
      title="Today vs Yesterday"
      subtitle={diffText}
      subtitleColor={diff > 5 ? "text-red-500" : "text-green-600"}
      onTellMore={() => router.push("/ai?context=today_vs_yesterday")}
      loading={loading}
    >
      <BarChart
        data={data}
        index="day"
        categories={["Spent (RM)"]}
        colors={["emerald"]}
        showLegend={false}
        showGridLines={false}
        className="h-32"
      />
    </SectionCard>
  );
}
```

---

## components/insights/WeeklyTrend.tsx

```tsx
"use client";
import { LineChart } from "@tremor/react";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { SectionCard } from "./SectionCard";

export default function WeeklyTrend({ transactions, loading }: any) {
  const router = useRouter();

  // Build 7-day daily totals
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const total = transactions
      .filter((t: any) => t.date === dateStr)
      .reduce((s: number, t: any) => s + t.amount, 0);
    return { day: format(d, "EEE"), "Daily Spend (RM)": total };
  });

  const avg = days.reduce((s, d) => s + d["Daily Spend (RM)"], 0) / 7;

  return (
    <SectionCard
      title="7-Day Spending Trend"
      subtitle={`Daily average: RM${avg.toFixed(0)}`}
      onTellMore={() => router.push("/ai?context=weekly_trend")}
      loading={loading}
    >
      <LineChart
        data={days}
        index="day"
        categories={["Daily Spend (RM)"]}
        colors={["emerald"]}
        showLegend={false}
        showGridLines={false}
        curveType="monotone"
        className="h-36"
      />
    </SectionCard>
  );
}
```

---

## components/insights/GoalProgress.tsx

```tsx
"use client";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { SectionCard } from "./SectionCard";
import { format } from "date-fns";

const STATUS_CONFIG = {
  on_track:  { icon: CheckCircle,   color: "text-green-500", bg: "bg-green-50",  label: "On Track" },
  at_risk:   { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", label: "At Risk" },
  off_track: { icon: XCircle,       color: "text-red-500",   bg: "bg-red-50",   label: "Off Track" },
};

export default function GoalProgress({ goals, userId, loading }: any) {
  const router = useRouter();

  if (goals.length === 0 && !loading) return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-sm text-gray-400 py-8">
      No goals yet. Chat with AI to set your first goal →
    </div>
  );

  return (
    <SectionCard title="Goal Progress" loading={loading}>
      <div className="space-y-4">
        {goals.map((g: any) => {
          const pct = Math.min(100, (g.saved_amount / g.target_amount) * 100);
          const config = STATUS_CONFIG[g.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.on_track;
          const StatusIcon = config.icon;
          const monthsLeft = Math.max(0, Math.ceil(
            (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
          ));

          return (
            <div key={g.id} className={`${config.bg} rounded-xl p-3.5`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    RM{g.saved_amount} / RM{g.target_amount} • {monthsLeft}mo left
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
              </div>

              <Progress value={pct} className="h-2 mb-2" />

              {g.tips && (
                <p className="text-xs text-gray-600 italic mt-1">💡 {g.tips}</p>
              )}

              {(g.status === "at_risk" || g.status === "off_track") && (
                <button
                  onClick={() => router.push(`/ai?context=goal_${g.id}&goal=${encodeURIComponent(g.name)}`)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700 bg-white rounded-lg px-2.5 py-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Fix this with AI
                </button>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
```

---

## components/insights/WhatIfSimulator.tsx

```tsx
"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { SectionCard } from "./SectionCard";

const CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "transport", label: "Transport" },
];

export default function WhatIfSimulator({ limits, goals, userId }: any) {
  const [category, setCategory] = useState("food");
  const [reduceBy, setReduceBy] = useState(50);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Debounced GLM call
  const runSimulation = useCallback(async (cat: string, amount: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{
            role: "user",
            content: `What-if simulation: If I reduce my ${cat} spending by RM${amount} per month, how does that affect my goals? Give a specific 1-2 sentence answer with numbers. No action tags.`,
          }],
        }),
      });
      const data = await res.json();
      setResult(data.message ?? "");
    } catch {
      setResult("Could not calculate. Try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return (
    <SectionCard
      title="What-If Simulator"
      subtitle="See how small changes affect your goals"
      onTellMore={() => router.push(`/ai?context=whatif&category=${category}&amount=${reduceBy}`)}
    >
      <div className="space-y-4">
        {/* Category selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                category === c.value
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Cut by</span>
            <span className="font-bold text-green-600">RM{reduceBy}/month</span>
          </div>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={reduceBy}
            onChange={e => setReduceBy(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>RM20</span>
            <span>RM300</span>
          </div>
        </div>

        {/* Run button */}
        <button
          onClick={() => runSimulation(category, reduceBy)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Calculate Impact
        </button>

        {/* Result */}
        {result && (
          <div className="bg-green-50 rounded-xl p-3 border border-green-100">
            <p className="text-sm text-gray-800 leading-relaxed">{result}</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
```

---

## components/insights/PatternChips.tsx

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";
import { format, getDay } from "date-fns";

function detectPatterns(transactions: any[]) {
  const patterns: { label: string; context: string; severity: "green" | "yellow" | "red" }[] = [];

  if (transactions.length < 5) return patterns;

  // Weekend spender check
  const weekendSpend = transactions
    .filter(t => { const d = getDay(new Date(t.date)); return d === 0 || d === 6; })
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalSpend = transactions.reduce((s: number, t: any) => s + t.amount, 0);
  const weekendPct = totalSpend > 0 ? (weekendSpend / totalSpend) * 100 : 0;
  if (weekendPct > 50) patterns.push({ label: "Weekend Spender", context: "weekend_spender", severity: "yellow" });

  // GrabFood dependent
  const grabCount = transactions.filter(t => t.merchant?.toLowerCase().includes("grab")).length;
  if (grabCount > 8) patterns.push({ label: "GrabFood Reliant", context: "grabfood_reliant", severity: "yellow" });

  // Shopee splurger
  const shopeeSpend = transactions
    .filter(t => t.merchant?.toLowerCase().includes("shopee"))
    .reduce((s: number, t: any) => s + t.amount, 0);
  if (shopeeSpend > 200) patterns.push({ label: "Shopee Splurger", context: "shopee_splurger", severity: "red" });

  // Consistent saver
  const savingsSpend = transactions.filter(t => t.category === "savings").length;
  if (savingsSpend > 0) patterns.push({ label: "Active Saver", context: "active_saver", severity: "green" });

  return patterns;
}

const SEVERITY_STYLES = {
  green:  "bg-green-100 text-green-700 border border-green-200",
  yellow: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  red:    "bg-red-100 text-red-700 border border-red-200",
};

export default function PatternChips({ transactions, userId, loading }: any) {
  const router = useRouter();
  const patterns = detectPatterns(transactions);

  if (loading || patterns.length === 0) return null;

  return (
    <SectionCard
      title="Your Spending Patterns"
      subtitle="AI-detected from your behaviour"
      loading={loading}
    >
      <div className="flex flex-wrap gap-2">
        {patterns.map(p => (
          <button
            key={p.label}
            onClick={() => router.push(`/ai?context=${p.context}`)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_STYLES[p.severity]} hover:opacity-80 transition-opacity`}
          >
            {p.label} →
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">Tap any pattern to discuss with AI</p>
    </SectionCard>
  );
}
```

---

## components/insights/WeeklySummaryCard.tsx

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Summary {
  win: string;
  watch_out: string;
  one_thing: string;
}

export default function WeeklySummaryCard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { generateSummary(); }, []);

  async function generateSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{
            role: "user",
            content: `Generate my weekly financial summary as JSON:
{"win":"biggest financial win from past 7 days (specific)","watch_out":"most important risk this week (specific)","one_thing":"one actionable recommendation (specific and achievable)"}
Only output JSON.`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.message ?? "{}";
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        setSummary(parsed);
      } catch {
        setSummary({ win: data.message, watch_out: "", one_thing: "" });
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-48 rounded-2xl" />;

  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">This Week's Report</p>
        </div>
        <button onClick={generateSummary} className="text-white/60 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {summary && (
        <div className="space-y-3">
          {summary.win && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <Trophy className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">Win 🏆</p>
                <p className="text-sm text-white leading-snug">{summary.win}</p>
              </div>
            </div>
          )}
          {summary.watch_out && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-orange-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">Watch Out ⚡</p>
                <p className="text-sm text-white leading-snug">{summary.watch_out}</p>
              </div>
            </div>
          )}
          {summary.one_thing && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <Lightbulb className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">This Week's One Thing</p>
                <p className="text-sm text-white leading-snug">{summary.one_thing}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => router.push("/ai?context=weekly_summary")}
        className="mt-3 w-full text-xs text-green-100 hover:text-white font-medium py-1"
      >
        Discuss this with AI →
      </button>
    </div>
  );
}
```

---

## components/insights/SectionCard.tsx (Shared)

```tsx
"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  children: React.ReactNode;
  onTellMore?: () => void;
  loading?: boolean;
}

export function SectionCard({ title, subtitle, subtitleColor = "text-gray-500", children, onTellMore, loading }: Props) {
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className={`text-xs mt-0.5 ${subtitleColor}`}>{subtitle}</p>}
        </div>
        {onTellMore && (
          <button
            onClick={onTellMore}
            className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Tell me more
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
```
