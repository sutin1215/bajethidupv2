# Step 6 — Page 1: Home (Wallet View)

Route: `/dashboard`

---

## What This Page Does

The Home page is the user's daily anchor. Opens instantly. Shows where money stands right now. No overwhelm — just clarity.

**Key elements top to bottom:**
1. Header (greeting + month selector)
2. Health Ring (big donut chart — spent vs budget)
3. AI Insight Card (GLM's top observation today)
4. Category Cards (horizontal scroll)
5. Quick Add Button (floating)
6. Recent Transactions Feed

---

## app/dashboard/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, CategoryLimit, Goal } from "@/lib/types";
import AppShell from "@/components/layout/AppShell";
import HealthRing from "@/components/home/HealthRing";
import InsightCard from "@/components/home/InsightCard";
import CategoryCard from "@/components/home/CategoryCard";
import TransactionFeed from "@/components/home/TransactionFeed";
import QuickAddSheet from "@/components/home/QuickAddSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";

// DEMO USER — swap with real auth later
const USER_ID = "demo-user-amirah";

const CATEGORIES = ["food","transport","shopping","entertainment","bills","savings","others"] as const;

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [income, setIncome] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Realtime subscription — updates when GLM writes new transactions
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "transactions",
        filter: `user_id=eq.${USER_ID}`,
      }, () => loadData())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "category_limits",
        filter: `user_id=eq.${USER_ID}`,
      }, () => loadData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split("T")[0];

    const [txRes, limRes, goalsRes, userRes] = await Promise.all([
      supabase.from("transactions").select("*")
        .eq("user_id", USER_ID).gte("date", startOfMonth).order("date", { ascending: false }),
      supabase.from("category_limits").select("*").eq("user_id", USER_ID),
      supabase.from("goals").select("*").eq("user_id", USER_ID),
      supabase.from("users").select("income").eq("id", USER_ID).single(),
    ]);

    setTransactions(txRes.data ?? []);
    setLimits(limRes.data ?? []);
    setGoals(goalsRes.data ?? []);
    setIncome(userRes.data?.income ?? 0);
    setLoading(false);
  }

  // Aggregate spending by category this month
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = transactions
      .filter(t => t.category === cat)
      .reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const totalBudget = limits.reduce((s, l) => s + l.monthly_limit, income * 0.8);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppShell activeTab="dashboard">
      <div className="px-4 pt-6 pb-24 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{greeting()}, Amirah 👋</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {format(new Date(), "MMMM yyyy")}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-bold text-sm">A</span>
          </div>
        </div>

        {/* Health Ring */}
        <HealthRing
          totalSpent={totalSpent}
          totalBudget={totalBudget}
          loading={loading}
        />

        {/* AI Insight Card */}
        <InsightCard userId={USER_ID} transactions={transactions} limits={limits} goals={goals} />

        {/* Category Cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Spending by Category
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.filter(c => c !== "others").map(cat => {
              const limit = limits.find(l => l.category === cat);
              return (
                <CategoryCard
                  key={cat}
                  category={cat}
                  spent={byCategory[cat] ?? 0}
                  limit={limit?.monthly_limit}
                  setByAi={limit?.set_by_ai}
                />
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Transactions
          </h2>
          <TransactionFeed transactions={transactions.slice(0, 15)} loading={loading} />
        </div>
      </div>

      {/* Floating Quick Add Button */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-green-600 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all z-10"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Quick Add Sheet */}
      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        userId={USER_ID}
        onAdded={loadData}
      />
    </AppShell>
  );
}
```

---

## components/home/HealthRing.tsx

```tsx
"use client";
import { DonutChart } from "@tremor/react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  totalSpent: number;
  totalBudget: number;
  loading: boolean;
}

export default function HealthRing({ totalSpent, totalBudget, loading }: Props) {
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = Math.max(0, totalBudget - totalSpent);

  const color = pct < 70 ? "emerald" : pct < 90 ? "yellow" : "red";
  const statusText = pct < 70 ? "On Track" : pct < 90 ? "Watch Out" : "Over Budget";
  const statusColor = pct < 70 ? "text-green-600" : pct < 90 ? "text-yellow-600" : "text-red-600";

  if (loading) return <Skeleton className="h-52 w-full rounded-2xl" />;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Monthly Budget</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          pct < 70 ? "bg-green-100 text-green-700" : pct < 90 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
        }`}>{statusText}</span>
      </div>

      <div className="relative flex items-center justify-center">
        <DonutChart
          data={[
            { name: "Spent", value: totalSpent },
            { name: "Remaining", value: Math.max(0, remaining) },
          ]}
          category="value"
          index="name"
          colors={[color, "gray"]}
          showLabel={false}
          showTooltip={false}
          className="h-40"
        />
        {/* Centre text */}
        <div className="absolute text-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900">RM{totalSpent.toFixed(0)}</p>
          <p className="text-xs text-gray-400">of RM{totalBudget.toFixed(0)}</p>
          <p className={`text-xs font-semibold mt-0.5 ${statusColor}`}>{Math.round(pct)}% used</p>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>RM{remaining.toFixed(0)} remaining</span>
        <span>{new Date().getDate()} days in</span>
      </div>
    </div>
  );
}
```

---

## components/home/InsightCard.tsx

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  userId: string;
  transactions: any[];
  limits: any[];
  goals: any[];
}

export default function InsightCard({ userId, transactions, limits, goals }: Props) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (transactions.length === 0) { setLoading(false); return; }
    generateInsight();
  }, [transactions.length]);

  async function generateInsight() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{
            role: "user",
            content: "Give me the single most important financial observation about my spending right now. Max 2 sentences. Be specific with numbers. No action tags needed.",
          }],
        }),
      });
      const data = await res.json();
      setInsight(data.message ?? "");
    } catch {
      setInsight("Tap to chat with your AI financial advisor.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-20 w-full rounded-2xl" />;

  return (
    <button
      onClick={() => router.push("/ai")}
      className="w-full bg-green-600 rounded-2xl p-4 text-left shadow-sm hover:bg-green-700 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-100 mb-1">AI Insight</p>
          <p className="text-sm text-white leading-snug">{insight}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
```

---

## components/home/CategoryCard.tsx

```tsx
"use client";
import { useRouter } from "next/navigation";
import { ShoppingBag, Utensils, Car, Music, Receipt, PiggyBank, MoreHorizontal } from "lucide-react";
import { Bot } from "lucide-react";

const ICONS: Record<string, any> = {
  food: Utensils, transport: Car, shopping: ShoppingBag,
  entertainment: Music, bills: Receipt, savings: PiggyBank, others: MoreHorizontal,
};

const LABELS: Record<string, string> = {
  food: "Food", transport: "Transport", shopping: "Shopping",
  entertainment: "Fun", bills: "Bills", savings: "Savings", others: "Others",
};

const COLORS: Record<string, { bg: string; icon: string; bar: string }> = {
  food:          { bg: "bg-orange-50",  icon: "text-orange-500",  bar: "bg-orange-400" },
  transport:     { bg: "bg-blue-50",    icon: "text-blue-500",    bar: "bg-blue-400" },
  shopping:      { bg: "bg-purple-50",  icon: "text-purple-500",  bar: "bg-purple-400" },
  entertainment: { bg: "bg-pink-50",    icon: "text-pink-500",    bar: "bg-pink-400" },
  bills:         { bg: "bg-red-50",     icon: "text-red-500",     bar: "bg-red-400" },
  savings:       { bg: "bg-green-50",   icon: "text-green-500",   bar: "bg-green-400" },
  others:        { bg: "bg-gray-50",    icon: "text-gray-500",    bar: "bg-gray-400" },
};

interface Props {
  category: string;
  spent: number;
  limit?: number;
  setByAi?: boolean;
}

export default function CategoryCard({ category, spent, limit, setByAi }: Props) {
  const router = useRouter();
  const Icon = ICONS[category] ?? MoreHorizontal;
  const colors = COLORS[category];
  const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
  const isOver = limit ? spent > limit : false;

  return (
    <button
      onClick={() => router.push(`/dashboard/${category}`)}
      className="flex-shrink-0 w-36 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-left hover:shadow-md active:scale-[0.97] transition-all"
    >
      <div className={`w-9 h-9 ${colors.bg} rounded-xl flex items-center justify-center mb-2.5`}>
        <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
      </div>

      <p className="text-xs text-gray-500 mb-0.5">{LABELS[category]}</p>
      <p className="text-base font-bold text-gray-900">RM{spent.toFixed(0)}</p>

      {limit && (
        <>
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">of RM{limit}</p>
            {setByAi && <Bot className="w-3 h-3 text-green-500" />}
          </div>
        </>
      )}
    </button>
  );
}
```

---

## components/home/TransactionFeed.tsx

```tsx
"use client";
import { Transaction } from "@/lib/types";
import { Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚗", shopping: "🛍️",
  entertainment: "🎬", bills: "📋", savings: "💰", others: "📦",
};

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export default function TransactionFeed({ transactions, loading }: Props) {
  if (loading) return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  );

  if (transactions.length === 0) return (
    <div className="text-center py-8 text-gray-400 text-sm">
      No transactions yet. Tap + to add one.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
      {transactions.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            {CATEGORY_EMOJI[t.category]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{t.merchant || t.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-gray-400">{format(new Date(t.date), "d MMM")}</p>
              {t.added_by_ai && (
                <span className="flex items-center gap-0.5 text-xs text-green-600">
                  <Bot className="w-3 h-3" /> AI
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-red-500">-RM{t.amount.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## components/home/QuickAddSheet.tsx

```tsx
"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded: () => void;
}

export default function QuickAddSheet({ open, onClose, userId, onAdded }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleAdd() {
    if (!input.trim()) return;
    setLoading(true);
    try {
      // Send to GLM — it will parse and log the transaction via LOG_TRANSACTION action
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{
            role: "user",
            content: `I just spent: ${input}. Please log this transaction for me.`,
          }],
        }),
      });
      const data = await res.json();

      if (data.action_result?.success) {
        toast({ title: "Transaction added ✓", description: data.message });
        setInput("");
        onClose();
        onAdded();
      } else {
        toast({ title: "Added!", description: data.message });
        onClose();
        onAdded();
      }
    } catch {
      toast({ title: "Error", description: "Could not add transaction", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">Quick Add</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
            <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700">AI will categorise automatically</p>
          </div>

          <textarea
            className="w-full bg-gray-50 rounded-xl p-3.5 text-sm outline-none resize-none border border-gray-200 focus:border-green-400 transition-colors"
            rows={3}
            placeholder={'e.g. "GrabFood nasi lemak RM12"\n"Shell petrol RM60 just now"\n"Shopee haul RM87"'}
            value={input}
            onChange={e => setInput(e.target.value)}
            autoFocus
          />

          <Button
            onClick={handleAdd}
            disabled={loading || !input.trim()}
            className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Transaction"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```
