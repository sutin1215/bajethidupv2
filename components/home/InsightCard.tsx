"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  userId: string;
  transactions: any[];
  limits: any[];
  goals: any[];
}

export default function InsightCard({ userId, transactions, limits, goals }: Props) {
  const [insight, setInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (transactions.length === 0) {
      setLoading(false);
      setInsight("Start adding transactions to get AI-powered insights about your spending.");
      return;
    }
    generateInsight();
  }, [transactions.length]);

  async function generateInsight() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{
            role: "user",
            content: "Give me the single most important financial observation about my spending right now. Max 2 sentences. Be specific with numbers. No action tags needed.",
          }],
        }),
      });
      const data = await res.json();
      setInsight(data.message ?? "Tap to chat with your AI financial advisor.");
    } catch {
      setInsight("Tap to chat with your AI financial advisor.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Skeleton className="h-20 w-full rounded-2xl" />;

  return (
    <button
      onClick={() => router.push("/ai")}
      className="w-full bg-green-600 rounded-2xl p-4 text-left shadow-sm hover:bg-green-700 active:scale-[0.98] transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-100 mb-1">AI Insight</p>
          <p className="text-sm text-white leading-snug">{insight}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/60 flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}
