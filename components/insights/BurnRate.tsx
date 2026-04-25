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
  const projected = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInMonth : 0;
  const projectedOver = projected - totalBudget;
  const pct = Math.min(100, (totalSpent / totalBudget) * 100);
  const expectedPct = (daysElapsed / daysInMonth) * 100;
  const isAhead = pct > expectedPct + 10;

  return (
    <SectionCard title="Monthly Burn Rate" subtitle={`Day ${daysElapsed} of ${daysInMonth}`} onTellMore={() => router.push("/ai?context=burn_rate")} loading={loading}>
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
              ? `Projected to overspend by RM${projectedOver.toFixed(0)} this month`
              : `On track — projected to end ${Math.round(100 - (projected / totalBudget) * 100)}% under budget`}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
