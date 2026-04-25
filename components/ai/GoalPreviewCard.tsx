"use client";
import { useState } from "react";
import { Target, Loader2, CheckCircle } from "lucide-react";
import { GoalPreview } from "@/lib/types";
import { format, addMonths } from "date-fns";

interface Props {
  preview: GoalPreview;
  userId: string;
  onAdded: (name: string) => void;
}

export default function GoalPreviewCard({ preview, userId, onAdded }: Props) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function addGoal() {
    setLoading(true);
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action: {
            type: "CREATE_GOAL",
            payload: {
              name: preview.name,
              target_amount: preview.target_amount,
              monthly_contribution: preview.monthly_contribution,
              deadline: preview.deadline,
              tips: preview.tips,
            },
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdded(true);
        onAdded(preview.name);
      }
    } finally {
      setLoading(false);
    }
  }

  const months = Math.ceil(
    (new Date(preview.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="ml-9 mt-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">New Goal Preview</p>
            <p className="font-bold text-gray-900">{preview.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Target</p>
            <p className="font-bold text-gray-900 text-sm">RM{preview.target_amount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Monthly</p>
            <p className="font-bold text-green-600 text-sm">RM{preview.monthly_contribution}</p>
          </div>
          <div className="bg-white rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-400">Timeline</p>
            <p className="font-bold text-gray-900 text-sm">{months}mo</p>
          </div>
        </div>

        {preview.tips && (
          <p className="text-xs text-gray-600 bg-white rounded-xl p-2.5 mb-3 italic">
            💡 {preview.tips}
          </p>
        )}

        {preview.suggested_category_reduction && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5 mb-3">
            ⚡ Suggested: Reduce {preview.suggested_category_reduction.category} by
            RM{preview.suggested_category_reduction.reduce_by}/month to fund this goal
          </p>
        )}
      </div>

      <div className="px-4 pb-3">
        {added ? (
          <div className="flex items-center justify-center gap-2 py-2.5 bg-green-600 rounded-xl">
            <CheckCircle className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Added to Goals!</span>
          </div>
        ) : (
          <button
            onClick={addGoal}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-medium text-white transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            Add to My Goals
          </button>
        )}
      </div>
    </div>
  );
}
