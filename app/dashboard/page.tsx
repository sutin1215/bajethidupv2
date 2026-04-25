"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, CategoryLimit, Goal } from "@/lib/types";
import { DEMO_USER_ID } from "@/lib/constants";
import AppShell from "@/components/layout/AppShell";
import HealthRing from "@/components/home/HealthRing";
import InsightCard from "@/components/home/InsightCard";
import CategoryCard from "@/components/home/CategoryCard";
import TransactionFeed from "@/components/home/TransactionFeed";
import QuickAddSheet from "@/components/home/QuickAddSheet";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const CATEGORIES = ["food", "transport", "shopping", "entertainment", "bills", "savings", "others"] as const;

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [limits, setLimits] = useState<CategoryLimit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [income, setIncome] = useState(0);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadData();
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "transactions",
        filter: `user_id=eq.${DEMO_USER_ID}`,
      }, () => loadData())
      .on("postgres_changes", {
        event: "*", schema: "public", table: "category_limits",
        filter: `user_id=eq.${DEMO_USER_ID}`,
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
        .eq("user_id", DEMO_USER_ID).gte("date", startOfMonth).order("date", { ascending: false }),
      supabase.from("category_limits").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("goals").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("users").select("income").eq("id", DEMO_USER_ID).single(),
    ]);

    setTransactions(txRes.data ?? []);
    setLimits(limRes.data ?? []);
    setGoals(goalsRes.data ?? []);
    setIncome(userRes.data?.income ?? 0);
    setLoading(false);
  }

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = transactions
      .filter(t => t.category === cat)
      .reduce((s, t) => s + t.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const totalBudget = limits.length > 0
    ? limits.reduce((s, l) => s + l.monthly_limit, 0)
    : income * 0.8;

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
            <p className="text-sm text-gray-500">
              {mounted ? greeting() : "Welcome back"}, Amirah 👋
            </p>
            <h1 className="text-2xl font-bold text-gray-900">
              {mounted ? format(new Date(), "MMMM yyyy") : "Loading..."}
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
        <InsightCard userId={DEMO_USER_ID} transactions={transactions} limits={limits} goals={goals} />

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

      {/* Floating Quick Add */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-green-600 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all z-10"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      <QuickAddSheet
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        userId={DEMO_USER_ID}
        onAdded={loadData}
      />
    </AppShell>
  );
}
