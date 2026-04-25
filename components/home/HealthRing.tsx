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
        <div className="absolute text-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900">RM{totalSpent.toFixed(0)}</p>
          <p className="text-xs text-gray-400">of RM{totalBudget.toFixed(0)}</p>
          <p className={`text-xs font-semibold mt-0.5 ${statusColor}`}>{Math.round(pct)}% used</p>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>RM{remaining.toFixed(0)} remaining</span>
        <span>This month</span>
      </div>
    </div>
  );
}
