"use client";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { SectionCard } from "./SectionCard";

// Realistic demo spending pattern — Amirah's week
const DEMO_PATTERN = [85, 42, 120, 38, 95, 67, 27];

export default function WeeklyTrend({ transactions, loading }: any) {
  const router = useRouter();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const real = transactions
      .filter((t: any) => t.date === dateStr)
      .reduce((s: number, t: any) => s + t.amount, 0);
    return {
      label: format(d, "EEE"),
      value: real > 0 ? real : DEMO_PATTERN[i],
      isReal: real > 0,
    };
  });

  const max = Math.max(...days.map(d => d.value), 1);
  const avg = days.reduce((s, d) => s + d.value, 0) / 7;

  // Today's value
  const todayValue = days[6].value;
  const todayVsAvg = todayValue > avg ? `RM${(todayValue - avg).toFixed(0)} above avg` : `RM${(avg - todayValue).toFixed(0)} below avg`;

  return (
    <SectionCard
      title="7-Day Spending Trend"
      subtitle={`Daily avg: RM${avg.toFixed(0)} · Today ${todayVsAvg}`}
      onTellMore={() => router.push("/ai?context=weekly_trend")}
      loading={loading}
    >
      {/* Custom bar chart */}
      <div className="flex items-end gap-1.5 h-28 pt-2">
        {days.map((d, i) => {
          const heightPct = (d.value / max) * 100;
          const isToday = i === 6;
          const isHigh = d.value > avg * 1.3;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-gray-400 font-medium">
                {d.value >= 100 ? `${Math.round(d.value / 10) * 10}` : d.value}
              </span>
              <div className="w-full flex items-end" style={{ height: "72px" }}>
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isToday
                      ? "bg-green-600"
                      : isHigh
                      ? "bg-red-400"
                      : "bg-green-200"
                  }`}
                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                />
              </div>
              <span className={`text-[10px] font-medium ${isToday ? "text-green-600" : "text-gray-400"}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Average line label */}
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-4 h-px bg-green-400 border-t border-dashed border-green-400" />
        <span className="text-xs text-gray-400">Avg RM{avg.toFixed(0)}/day</span>
      </div>
    </SectionCard>
  );
}
