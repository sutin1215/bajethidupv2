"use client";
import { useRouter } from "next/navigation";
import { ShoppingBag, Utensils, Car, Music, Receipt, PiggyBank, MoreHorizontal, Bot } from "lucide-react";

const ICONS: Record<string, any> = {
  food: Utensils, transport: Car, shopping: ShoppingBag,
  entertainment: Music, bills: Receipt, savings: PiggyBank, others: MoreHorizontal,
};

const LABELS: Record<string, string> = {
  food: "Food", transport: "Transport", shopping: "Shopping",
  entertainment: "Fun", bills: "Bills", savings: "Savings", others: "Others",
};

const COLORS: Record<string, { bg: string; icon: string; bar: string }> = {
  food:          { bg: "bg-orange-50",  icon: "text-orange-500",  bar: "bg-orange-400" },
  transport:     { bg: "bg-blue-50",    icon: "text-blue-500",    bar: "bg-blue-400" },
  shopping:      { bg: "bg-purple-50",  icon: "text-purple-500",  bar: "bg-purple-400" },
  entertainment: { bg: "bg-pink-50",    icon: "text-pink-500",    bar: "bg-pink-400" },
  bills:         { bg: "bg-red-50",     icon: "text-red-500",     bar: "bg-red-400" },
  savings:       { bg: "bg-green-50",   icon: "text-green-500",   bar: "bg-green-400" },
  others:        { bg: "bg-gray-50",    icon: "text-gray-500",    bar: "bg-gray-400" },
};

interface Props {
  category: string;
  spent: number;
  limit?: number;
  setByAi?: boolean;
}

export default function CategoryCard({ category, spent, limit, setByAi }: Props) {
  const router = useRouter();
  const Icon = ICONS[category] ?? MoreHorizontal;
  const colors = COLORS[category] ?? COLORS.others;
  const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
  const isOver = limit ? spent > limit : false;

  return (
    <button
      onClick={() => router.push(`/ai?context=category_${category}`)}
      className="flex-shrink-0 w-36 bg-white rounded-2xl p-3.5 shadow-sm border border-gray-100 text-left hover:shadow-md active:scale-[0.97] transition-all"
    >
      <div className={`w-9 h-9 ${colors.bg} rounded-xl flex items-center justify-center mb-2.5`}>
        <Icon className={`w-5 h-5 ${colors.icon}`} />
      </div>

      <p className="text-xs text-gray-500 mb-0.5">{LABELS[category]}</p>
      <p className="text-base font-bold text-gray-900">RM{spent.toFixed(0)}</p>

      {limit && (
        <>
          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isOver ? "bg-red-400" : colors.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">of RM{limit}</p>
            {setByAi && <Bot className="w-3 h-3 text-green-500" />}
          </div>
        </>
      )}
    </button>
  );
}
