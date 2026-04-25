"use client";
import { useRouter } from "next/navigation";
import { format, subDays } from "date-fns";
import { SectionCard } from "./SectionCard";

export default function TodayVsYesterday({ transactions, loading }: any) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todayRaw = transactions
    .filter((t: any) => t.date === today)
    .reduce((s: number, t: any) => s + t.amount, 0);
  const yesterdayRaw = transactions
    .filter((t: any) => t.date === yesterday)
    .reduce((s: number, t: any) => s + t.amount, 0);

  // Always show demo data if no real data for these specific days
  const todayTotal = todayRaw > 0 ? todayRaw : 42;
  const yesterdayTotal = yesterdayRaw > 0 ? yesterdayRaw : 68;

  const diff = todayTotal - yesterdayTotal;
  const isLess = diff < 0;
  const diffText = diff === 0
    ? "Same as yesterday"
    : isLess
    ? `RM${Math.abs(diff).toFixed(0)} less than yesterday 🎉`
    : `RM${diff.toFixed(0)} more than yesterday`;

  const max = Math.max(todayTotal, yesterdayTotal, 1);

  const bars = [
    { label: "Yesterday", value: yesterdayTotal, color: "bg-gray-300" },
    { label: "Today", value: todayTotal, color: diff <= 0 ? "bg-green-500" : "bg-red-400" },
  ];

  return (
    <SectionCard
      title="Today vs Yesterday"
      subtitle={diffText}
      subtitleColor={isLess ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-500"}
      onTellMore={() => router.push("/ai?context=today_vs_yesterday")}
      loading={loading}
    >
      <div className="flex items-end gap-6 h-28 px-4 pt-2">
        {bars.map(bar => {
          const heightPct = (bar.value / max) * 100;
          return (
            <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-sm font-bold text-gray-800">RM{bar.value.toFixed(0)}</span>
              <div className="w-full flex items-end" style={{ height: "64px" }}>
                <div
                  className={`w-full ${bar.color} rounded-t-xl transition-all`}
                  style={{ height: `${Math.max(heightPct, 6)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{bar.label}</span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
