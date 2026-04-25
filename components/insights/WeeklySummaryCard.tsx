"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Summary { win: string; watch_out: string; one_thing: string; }

export default function WeeklySummaryCard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => { generateSummary(); }, []);

  async function generateSummary() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{ role: "user", content: `Generate my weekly financial summary as JSON only:\n{"win":"biggest financial win from past 7 days (specific)","watch_out":"most important risk this week (specific)","one_thing":"one actionable recommendation (specific and achievable)"}` }],
        }),
      });
      const data = await res.json();
      const text = data.message ?? "{}";
      try {
        setSummary(JSON.parse(text.replace(/```json|```/g, "").trim()));
      } catch {
        setSummary({ win: data.message, watch_out: "", one_thing: "" });
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-48 rounded-2xl" />;

  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">This Week's Report</p>
        </div>
        <button onClick={generateSummary} className="text-white/60 hover:text-white">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {summary && (
        <div className="space-y-3">
          {summary.win && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <Trophy className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">Win</p>
                <p className="text-sm text-white leading-snug">{summary.win}</p>
              </div>
            </div>
          )}
          {summary.watch_out && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-orange-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">Watch Out</p>
                <p className="text-sm text-white leading-snug">{summary.watch_out}</p>
              </div>
            </div>
          )}
          {summary.one_thing && (
            <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
              <Lightbulb className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-green-100 font-medium mb-0.5">This Week's One Thing</p>
                <p className="text-sm text-white leading-snug">{summary.one_thing}</p>
              </div>
            </div>
          )}
        </div>
      )}
      <button onClick={() => router.push("/ai?context=weekly_summary")} className="mt-3 w-full text-xs text-green-100 hover:text-white font-medium py-1">
        Discuss this with AI →
      </button>
    </div>
  );
}
