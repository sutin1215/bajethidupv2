"use client";
import { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { DecisionCard as DecisionCardType } from "@/lib/types";

interface Props {
  card: DecisionCardType;
  userId: string;
  onActionTaken: (description: string) => void;
}

export default function DecisionCard({ card, userId, onActionTaken }: Props) {
  const [executing, setExecuting] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  async function executeOption(optionIndex: number) {
    const option = card.options[optionIndex];
    if (!option.action) return;

    setExecuting(optionIndex);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: option.action }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        onActionTaken(`${option.label} applied`);
      }
    } finally {
      setExecuting(null);
    }
  }

  return (
    <div className="ml-9 mt-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trade-off Analysis</p>
        <p className="text-sm text-gray-800 mt-0.5">{card.situation}</p>
      </div>

      {/* Options */}
      <div className="divide-y divide-gray-50">
        {card.options.map((opt, i) => (
          <div
            key={i}
            className={`px-4 py-3 ${i === card.recommended_index ? "bg-green-50/50" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                  {i === card.recommended_index && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600">{opt.trade_off}</p>
                <p className="text-xs text-gray-500 mt-0.5 italic">{opt.impact_on_goals}</p>
              </div>
              {opt.action && !done && (
                <button
                  onClick={() => executeOption(i)}
                  disabled={executing !== null}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    i === card.recommended_index
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {executing === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {done ? (
        <div className="px-4 py-2.5 bg-green-50 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-xs text-green-700 font-medium">Applied! Your data has been updated.</p>
        </div>
      ) : (
        <div className="px-4 py-2.5 bg-gray-50">
          <p className="text-xs text-gray-500">
            💡 Recommendation: {card.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}
