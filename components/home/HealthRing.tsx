"use client";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  totalSpent: number;
  totalBudget: number;
  loading: boolean;
}

export default function HealthRing({ totalSpent, totalBudget, loading }: Props) {
  const pct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = Math.max(0, totalBudget - totalSpent);

  const isWarning = pct >= 70 && pct < 90;
  const isDanger = pct >= 90;

  const colorClass = isDanger ? "text-red-500" : isWarning ? "text-yellow-400" : "text-green-500";
  const strokeColor = isDanger ? "#ef4444" : isWarning ? "#facc15" : "#22c55e";
  
  const statusText = pct < 70 ? "On Track" : pct < 90 ? "Watch Out" : "Over Budget";
  const statusBg = pct < 70 ? "bg-green-100 text-green-700" : pct < 90 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";

  if (loading) return <Skeleton className="h-52 w-full rounded-2xl" />;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">Monthly Budget</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusBg}`}>
          {statusText}
        </span>
      </div>

      <div className="relative flex items-center justify-center py-2">
        {/* SVG Donut */}
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-gray-100"
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke={strokeColor}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-gray-900">RM{totalSpent.toFixed(0)}</p>
          <p className="text-xs text-gray-400">of RM{totalBudget.toFixed(0)}</p>
          <p className={`text-xs font-semibold mt-1 ${colorClass}`}>
            {Math.round(pct)}% used
          </p>
        </div>
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <span>RM{remaining.toFixed(0)} remaining</span>
        <span>This month</span>
      </div>
    </div>
  );
}
