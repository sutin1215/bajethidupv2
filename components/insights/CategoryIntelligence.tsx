"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚗", shopping: "🛍️",
  entertainment: "🎬", bills: "📋", savings: "💰", others: "📦",
};

export default function CategoryIntelligence({ transactions, limits, userId, loading }: any) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  const now = new Date();
  const thisMonthStart = startOfMonth(now).toISOString().split("T")[0];
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString().split("T")[0];
  const lastMonthEnd = startOfMonth(now).toISOString().split("T")[0];

  const categories = ["food", "transport", "shopping", "entertainment"];

  function getCategoryStats(cat: string) {
    const thisMonth = transactions
      .filter((t: any) => t.category === cat && t.date >= thisMonthStart)
      .reduce((s: number, t: any) => s + t.amount, 0);
    const lastMonth = transactions
      .filter((t: any) => t.category === cat && t.date >= lastMonthStart && t.date < lastMonthEnd)
      .reduce((s: number, t: any) => s + t.amount, 0);
    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    const limit = limits.find((l: any) => l.category === cat);
    return { thisMonth, lastMonth, change, limit };
  }

  return (
    <SectionCard title="Category Intelligence" loading={loading}>
      <div className="space-y-2">
        {categories.map(cat => {
          const { thisMonth, lastMonth, change, limit } = getCategoryStats(cat);
          const isUp = change > 0;
          const isExpanded = expanded === cat;

          return (
            <div key={cat} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isExpanded ? null : cat)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_EMOJI[cat]}</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{cat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">RM{thisMonth.toFixed(0)}</span>
                  {lastMonth > 0 && (
                    <span className={`text-xs font-medium ${isUp ? "text-red-500" : "text-green-600"}`}>
                      {isUp ? "↑" : "↓"}{Math.abs(change).toFixed(0)}%
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 bg-gray-50 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>This month: RM{thisMonth.toFixed(0)}</span>
                    <span>Last month: RM{lastMonth.toFixed(0)}</span>
                  </div>
                  {limit && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">vs limit</span>
                        <span className={thisMonth > limit.monthly_limit ? "text-red-500 font-medium" : "text-green-600 font-medium"}>
                          RM{thisMonth.toFixed(0)} / RM{limit.monthly_limit}
                        </span>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/ai?context=category_${cat}`)}
                    className="w-full text-xs text-green-600 font-medium py-1.5 bg-white rounded-lg border border-green-200"
                  >
                    Discuss {cat} spending with AI →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
