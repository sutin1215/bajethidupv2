# Step 5 — Shared Components & Layout

Build these before any page. All pages depend on them.

---

## components/layout/AppShell.tsx

```tsx
"use client";
import BottomNav from "./BottomNav";

interface Props {
  children: React.ReactNode;
  activeTab: "dashboard" | "insights" | "ai" | "profile";
}

export default function AppShell({ children, activeTab }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <main className="pb-20">{children}</main>
      <BottomNav activeTab={activeTab} />
    </div>
  );
}
```

---

## components/layout/BottomNav.tsx

```tsx
"use client";
import Link from "next/link";
import { Home, BarChart2, Sparkles, User } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "Home",     icon: Home,     href: "/dashboard" },
  { id: "insights",  label: "Insights", icon: BarChart2, href: "/insights" },
  { id: "ai",        label: "AI",       icon: Sparkles,  href: "/ai" },
  { id: "profile",   label: "Profile",  icon: User,      href: "/profile" },
];

interface Props {
  activeTab: string;
}

export default function BottomNav({ activeTab }: Props) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-2 py-2 z-20">
      <div className="flex justify-around">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Link key={tab.id} href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors ${
                isActive ? "text-green-600" : "text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : ""}`} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
                {tab.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full bg-green-600" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## components/insights/BurnRate.tsx

```tsx
"use client";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";
import { Progress } from "@/components/ui/progress";

export default function BurnRate({ transactions, limits, income, loading }: any) {
  const router = useRouter();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();

  const totalSpent = transactions
    .filter((t: any) => t.date >= new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0])
    .reduce((s: number, t: any) => s + t.amount, 0);

  const totalBudget = limits.reduce((s: number, l: any) => s + l.monthly_limit, income * 0.8);
  const projected = (totalSpent / daysElapsed) * daysInMonth;
  const projectedOver = projected - totalBudget;
  const pct = Math.min(100, (totalSpent / totalBudget) * 100);

  const expectedPct = (daysElapsed / daysInMonth) * 100;
  const isAhead = pct > expectedPct + 10;

  return (
    <SectionCard
      title="Monthly Burn Rate"
      subtitle={`Day ${daysElapsed} of ${daysInMonth}`}
      onTellMore={() => router.push("/ai?context=burn_rate")}
      loading={loading}
    >
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Spent: <strong>RM{totalSpent.toFixed(0)}</strong></span>
          <span className="text-gray-600">Budget: <strong>RM{totalBudget.toFixed(0)}</strong></span>
        </div>
        <Progress value={pct} className="h-3" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(pct)}% used</span>
          <span>Expected: {Math.round(expectedPct)}%</span>
        </div>
        <div className={`rounded-xl p-3 ${isAhead ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-sm font-medium ${isAhead ? "text-red-700" : "text-green-700"}`}>
            {isAhead
              ? `⚠️ Projected to overspend by RM${projectedOver.toFixed(0)} this month`
              : `✓ On track — projected to end ${Math.round(100 - (projected / totalBudget) * 100)}% under budget`
            }
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
```

---

## components/insights/CategoryIntelligence.tsx

```tsx
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
```

---

## components/insights/SavingsVelocity.tsx

```tsx
"use client";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";
import { LineChart } from "@tremor/react";

export default function SavingsVelocity({ goals, income, loading }: any) {
  const router = useRouter();
  if (goals.length === 0) return null;

  // Build a projection chart for each goal (simplified: 6-month outlook)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return d.toLocaleDateString("en-MY", { month: "short" });
  });

  const chartData = months.map((month, i) => {
    const point: Record<string, any> = { month };
    goals.forEach((g: any) => {
      const current = g.saved_amount;
      const monthly = g.monthly_contribution;
      point[`${g.name} (actual)`] = current + monthly * i;
      const remaining = g.target_amount - current;
      const monthsLeft = Math.max(1,
        Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
      );
      const requiredMonthly = remaining / monthsLeft;
      point[`${g.name} (required)`] = current + requiredMonthly * i;
    });
    return point;
  });

  const categories = goals.flatMap((g: any) => [
    `${g.name} (actual)`,
    `${g.name} (required)`,
  ]);

  return (
    <SectionCard
      title="Savings Velocity"
      subtitle="Current pace vs what's needed"
      onTellMore={() => router.push("/ai?context=savings_velocity")}
      loading={loading}
    >
      <LineChart
        data={chartData}
        index="month"
        categories={categories}
        colors={["emerald", "slate", "blue", "gray"]}
        showLegend={true}
        showGridLines={false}
        curveType="monotone"
        className="h-40"
      />
      <p className="text-xs text-gray-400 mt-2">Solid line = current pace · Dashed = required pace</p>
    </SectionCard>
  );
}
```
