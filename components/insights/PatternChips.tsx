"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";
import { format, getDay } from "date-fns";

function detectPatterns(transactions: any[]) {
  const patterns: { label: string; context: string; severity: "green" | "yellow" | "red" }[] = [];
  if (transactions.length < 5) return patterns;

  const weekendSpend = transactions
    .filter(t => { const d = getDay(new Date(t.date)); return d === 0 || d === 6; })
    .reduce((s: number, t: any) => s + t.amount, 0);
  const totalSpend = transactions.reduce((s: number, t: any) => s + t.amount, 0);
  const weekendPct = totalSpend > 0 ? (weekendSpend / totalSpend) * 100 : 0;
  if (weekendPct > 50) patterns.push({ label: "Weekend Spender", context: "weekend_spender", severity: "yellow" });

  const grabCount = transactions.filter(t => t.merchant?.toLowerCase().includes("grab")).length;
  if (grabCount > 8) patterns.push({ label: "GrabFood Reliant", context: "grabfood_reliant", severity: "yellow" });

  const shopeeSpend = transactions
    .filter(t => t.merchant?.toLowerCase().includes("shopee"))
    .reduce((s: number, t: any) => s + t.amount, 0);
  if (shopeeSpend > 200) patterns.push({ label: "Shopee Splurger", context: "shopee_splurger", severity: "red" });

  const savingsCount = transactions.filter(t => t.category === "savings").length;
  if (savingsCount > 0) patterns.push({ label: "Active Saver", context: "active_saver", severity: "green" });

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
