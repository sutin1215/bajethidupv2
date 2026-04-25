"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, AlertCircle, Lightbulb, RefreshCw, Sparkles } from "lucide-react";

interface Summary { win: string; watch_out: string; one_thing: string; }

export default function WeeklySummaryCard({ userId }: { userId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function generateSummary() {
    setLoading(true);
    setError(null);
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

      if (!res.ok) {
        // Handle rate limit gracefully
        if (res.status === 500 && data.error?.includes?.("rate_limit")) {
          setError("AI is resting 😴 — free tier limit reached. Try again in a few minutes.");
        } else {
          setError("Couldn't generate summary right now. Try again!");
        }
        return;
      }

      const text = data.message ?? "{}";
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        setSummary(parsed);
      } catch {
        // AI responded with plain text instead of JSON — still useful
        setSummary({ win: text, watch_out: "", one_thing: "" });
      }
    } catch {
      setError("Couldn't connect. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Not yet generated — show a tap-to-generate card
  if (!summary && !loading && !error) {
    return (
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">This Week&apos;s Report</p>
        </div>
        <button
          onClick={generateSummary}
          className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-3 rounded-xl transition-all active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Generate AI Summary
        </button>
        <p className="text-center text-xs text-green-200 mt-2">Uses 1 AI call · takes ~3 seconds</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">Analysing your week...</p>
        </div>
        <div className="flex gap-1.5 justify-center py-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">This Week&apos;s Report</p>
        </div>
        <div className="bg-white/10 rounded-xl p-3 mb-3">
          <p className="text-sm text-white/80">{error}</p>
        </div>
        <button
          onClick={generateSummary}
          className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-green-100 text-xs font-medium">AI Weekly Summary</p>
          <p className="text-white font-bold text-base mt-0.5">This Week&apos;s Report</p>
        </div>
        <button onClick={generateSummary} className="text-white/60 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        {summary?.win && (
          <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
            <Trophy className="w-4 h-4 text-yellow-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-green-100 font-medium mb-0.5">Win 🏆</p>
              <p className="text-sm text-white leading-snug">{summary.win}</p>
            </div>
          </div>
        )}
        {summary?.watch_out && (
          <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-orange-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-green-100 font-medium mb-0.5">Watch Out ⚠️</p>
              <p className="text-sm text-white leading-snug">{summary.watch_out}</p>
            </div>
          </div>
        )}
        {summary?.one_thing && (
          <div className="flex gap-2.5 bg-white/10 rounded-xl p-3">
            <Lightbulb className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-green-100 font-medium mb-0.5">This Week&apos;s One Thing 💡</p>
              <p className="text-sm text-white leading-snug">{summary.one_thing}</p>
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => router.push("/ai?context=weekly_summary")}
        className="mt-3 w-full text-xs text-green-100 hover:text-white font-medium py-1 transition-colors"
      >
        Discuss this with AI →
      </button>
    </div>
  );
}
