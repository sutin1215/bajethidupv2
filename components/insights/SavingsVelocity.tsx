"use client";
import { useRouter } from "next/navigation";
import { SectionCard } from "./SectionCard";

const DEMO_GOAL = {
  name: "Emergency Fund",
  saved_amount: 1200,
  target_amount: 5000,
  monthly_contribution: 300,
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 13).toISOString(),
};

const DEMO_GOAL_2 = {
  name: "New Laptop",
  saved_amount: 450,
  target_amount: 2500,
  monthly_contribution: 200,
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 10).toISOString(),
};

export default function SavingsVelocity({ goals, income, loading }: any) {
  const router = useRouter();

  const activeGoals = goals.length > 0 ? goals.slice(0, 2) : [DEMO_GOAL, DEMO_GOAL_2];

  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return d.toLocaleDateString("en-MY", { month: "short" });
  });

  // Colors for each goal
  const COLORS = [
    { pace: "bg-green-500", target: "bg-green-200", paceText: "text-green-600" },
    { pace: "bg-blue-500", target: "bg-blue-200", paceText: "text-blue-600" },
  ];

  return (
    <SectionCard
      title="Savings Velocity"
      subtitle="Your pace vs what's needed"
      onTellMore={() => router.push("/ai?context=savings_velocity")}
      loading={loading}
    >
      <div className="space-y-4">
        {activeGoals.map((g: any, gi: number) => {
          const current = g.saved_amount ?? 0;
          const target = g.target_amount ?? 1;
          const monthly = g.monthly_contribution ?? 300;
          const deadline = new Date(g.deadline);
          const monthsLeft = Math.max(1, Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
          const remaining = target - current;
          const requiredMonthly = remaining / monthsLeft;
          const pct = Math.min(100, Math.round((current / target) * 100));
          const onTrack = monthly >= requiredMonthly;
          const c = COLORS[gi % COLORS.length];

          return (
            <div key={g.name ?? gi}>
              {/* Goal header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${c.pace}`} />
                  <span className="text-sm font-semibold text-gray-800">{g.name}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${onTrack ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {onTrack ? "On track ✓" : `+RM${(requiredMonthly - monthly).toFixed(0)}/mo needed`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="bg-gray-100 rounded-full h-2.5 mb-1.5">
                <div
                  className={`${c.pace} rounded-full h-2.5 transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>RM{current.toLocaleString()} saved</span>
                <span>RM{target.toLocaleString()} goal · {pct}%</span>
              </div>

              {/* Mini projection bars */}
              <div className="mt-2 flex items-end gap-1 h-12">
                {Array.from({ length: 6 }, (_, i) => {
                  const projectedPace = current + monthly * i;
                  const projectedRequired = current + requiredMonthly * i;
                  const maxVal = Math.max(target, projectedPace, projectedRequired);
                  const paceH = Math.min(100, (projectedPace / maxVal) * 100);
                  const reqH = Math.min(100, (projectedRequired / maxVal) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end gap-px" style={{ height: "36px" }}>
                        <div className={`flex-1 ${c.pace} rounded-t-sm opacity-80`} style={{ height: `${paceH}%` }} />
                        <div className={`flex-1 ${c.target} rounded-t-sm`} style={{ height: `${reqH}%` }} />
                      </div>
                      <span className="text-[8px] text-gray-400">{monthLabels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-xs text-gray-500">Your pace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-green-200 rounded-sm" />
          <span className="text-xs text-gray-500">Required pace</span>
        </div>
      </div>
    </SectionCard>
  );
}
