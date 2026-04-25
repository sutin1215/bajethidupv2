"use client";
import { Transaction } from "@/lib/types";
import { Bot } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍜", transport: "🚗", shopping: "🛍️",
  entertainment: "🎬", bills: "📋", savings: "💰", others: "📦",
};

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export default function TransactionFeed({ transactions, loading }: Props) {
  if (loading) return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  );

  if (transactions.length === 0) return (
    <div className="text-center py-8 text-gray-400 text-sm">
      No transactions yet. Tap + to add one.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
      {transactions.map(t => (
        <div key={t.id} className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
            {CATEGORY_EMOJI[t.category]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{t.merchant || t.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-gray-400">{format(new Date(t.date), "d MMM")}</p>
              {t.added_by_ai && (
                <span className="flex items-center gap-0.5 text-xs text-green-600">
                  <Bot className="w-3 h-3" /> AI
                </span>
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-red-500">-RM{t.amount.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
