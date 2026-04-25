"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { SectionCard } from "./SectionCard";

const CATEGORIES = [
  { value: "food", label: "Food & Dining" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "transport", label: "Transport" },
];

export default function WhatIfSimulator({ limits, goals, userId }: any) {
  const [category, setCategory] = useState("food");
  const [reduceBy, setReduceBy] = useState(50);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runSimulation = useCallback(async (cat: string, amount: number) => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          messages: [{ role: "user", content: `What-if: If I cut my ${cat} spending by RM${amount}/month, how does that affect my goals? 1-2 sentences, specific numbers. No action tags.` }],
        }),
      });
      const data = await res.json();
      setResult(data.message ?? "");
    } catch {
      setResult("Could not calculate. Try again.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return (
    <SectionCard title="What-If Simulator" subtitle="See how small changes affect your goals" onTellMore={() => router.push(`/ai?context=whatif&category=${category}&amount=${reduceBy}`)}>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${category === c.value ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Cut by</span>
            <span className="font-bold text-green-600">RM{reduceBy}/month</span>
          </div>
          <input type="range" min={20} max={300} step={10} value={reduceBy} onChange={e => setReduceBy(Number(e.target.value))} className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>RM20</span><span>RM300</span></div>
        </div>
        <button onClick={() => runSimulation(category, reduceBy)} disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Calculate Impact
        </button>
        {result && <div className="bg-green-50 rounded-xl p-3 border border-green-100"><p className="text-sm text-gray-800 leading-relaxed">{result}</p></div>}
      </div>
    </SectionCard>
  );
}
