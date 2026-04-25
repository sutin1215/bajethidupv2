"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";

export default function ContextBar({ contextData }: { contextData: any }) {
  const [expanded, setExpanded] = useState(false);

  if (!contextData) return null;

  const atRiskGoals = contextData.goals?.filter((g: any) => g.status !== "on_track") ?? [];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs text-gray-600 font-medium">
            AI sees: {contextData.goals?.length ?? 0} goals
            {atRiskGoals.length > 0 && ` • ${atRiskGoals.length} at risk`}
            {contextData.income && ` • RM${contextData.income} income`}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </div>

      {expanded && (
        <div className="mt-2 space-y-1">
          {contextData.goals?.map((g: any) => (
            <div key={g.id ?? g.name} className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{g.name}</span>
              <span className={`text-xs font-medium ${
                g.status === "on_track" ? "text-green-600" :
                g.status === "at_risk" ? "text-yellow-600" : "text-red-600"
              }`}>{g.status?.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
