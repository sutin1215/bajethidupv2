"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePersona } from "@/hooks/usePersona";
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

export default function InsightsPage() {
  const { userId, isReady } = usePersona();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    
    loadData();
    const channel = supabase
      .channel("insights-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${userId}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, isReady]);

  async function loadData() {
    setLoading(true);
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [txRes, goalsRes, limRes, userRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", userId).gte("date", thirtyDaysAgo.toISOString().split("T")[0]).order("date", { ascending: true }),
      supabase.from("goals").select("*").eq("user_id", userId),
      supabase.from("category_limits").select("*").eq("user_id", userId),
      supabase.from("users").select("income").eq("id", userId).single(),
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
        <CategoryIntelligence transactions={transactions} limits={limits} userId={userId} loading={loading} />
        <GoalProgress goals={goals} userId={userId} loading={loading} />
        <SavingsVelocity goals={goals} income={income} loading={loading} />
        <PatternChips transactions={transactions} userId={userId} loading={loading} />
        <WhatIfSimulator limits={limits} goals={goals} userId={userId} />
        <BurnRate transactions={transactions} limits={limits} income={income} loading={loading} />
        <WeeklySummaryCard userId={userId} />
      </div>
    </AppShell>
  );
}
