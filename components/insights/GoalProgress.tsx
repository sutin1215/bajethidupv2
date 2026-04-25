"use client";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { SectionCard } from "./SectionCard";

const STATUS_CONFIG = {
  on_track:  { icon: CheckCircle,   color: "text-green-500",  bg: "bg-green-50",  label: "On Track" },
  at_risk:   { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-50", label: "At Risk" },
  off_track: { icon: XCircle,       color: "text-red-500",    bg: "bg-red-50",    label: "Off Track" },
};

export default function GoalProgress({ goals, userId, loading }: any) {
  const router = useRouter();

  if (goals.length === 0 && !loading) return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-sm text-gray-400 py-8">
      No goals yet. Chat with AI to set your first goal →
    </div>
  );

  return (
    <SectionCard title="Goal Progress" loading={loading}>
      <div className="space-y-4">
        {goals.map((g: any) => {
          const pct = Math.min(100, (g.saved_amount / g.target_amount) * 100);
          const config = STATUS_CONFIG[g.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.on_track;
          const StatusIcon = config.icon;
          const monthsLeft = Math.max(0, Math.ceil(
            (new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
          ));

          return (
            <div key={g.id} className={`${config.bg} rounded-xl p-3.5`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    RM{g.saved_amount} / RM{g.target_amount} • {monthsLeft}mo left
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                </div>
              </div>

              <Progress value={pct} className="h-2 mb-2" />

              {g.tips && (
                <p className="text-xs text-gray-600 italic mt-1">💡 {g.tips}</p>
              )}

              {(g.status === "at_risk" || g.status === "off_track") && (
                <button
                  onClick={() => router.push(`/ai?context=goal_${g.id}&goal=${encodeURIComponent(g.name)}`)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-green-700 bg-white rounded-lg px-2.5 py-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Fix this with AI
                </button>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
