"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/constants";
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [income, setIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("insights-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "goals", filter: `user_id=eq.${DEMO_USER_ID}` }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${DEMO_USER_ID}` }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadData() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [txRes, goalsRes, limRes, userRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", DEMO_USER_ID).gte("date", thirtyDaysAgo.toISOString().split("T")[0]).order("date", { ascending: true }),
      supabase.from("goals").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("category_limits").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("users").select("income").eq("id", DEMO_USER_ID).single(),
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
        <CategoryIntelligence transactions={transactions} limits={limits} userId={DEMO_USER_ID} loading={loading} />
        <GoalProgress goals={goals} userId={DEMO_USER_ID} loading={loading} />
        <SavingsVelocity goals={goals} income={income} loading={loading} />
        <PatternChips transactions={transactions} userId={DEMO_USER_ID} loading={loading} />
        <WhatIfSimulator limits={limits} goals={goals} userId={DEMO_USER_ID} />
        <BurnRate transactions={transactions} limits={limits} income={income} loading={loading} />
        <WeeklySummaryCard userId={DEMO_USER_ID} />
      </div>
    </AppShell>
  );
}
