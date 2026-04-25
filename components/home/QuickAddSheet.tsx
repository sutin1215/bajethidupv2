"use client";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onAdded: () => void;
}

const DEMO_SUGGESTIONS = [
  "Nasi lemak RM12",
  "Zus Coffee RM15",
  "Grab to office RM8",
  "Shopee order RM45",
];

export default function QuickAddSheet({ open, onClose, userId, onAdded }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<{ description: string; amount: number; category: string } | null>(null);
  const { toast } = useToast();

  async function handleAdd(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    setLoading(true);
    setAdded(null);
    try {
      const res = await fetch("/api/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, text: value }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: "Couldn't parse that", description: data.error ?? "Try: Nasi lemak RM12", variant: "destructive" });
        return;
      }

      setAdded(data);
      setInput("");
      setTimeout(() => {
        setAdded(null);
        onClose();
        onAdded();
      }, 1400);
    } catch {
      toast({ title: "Error", description: "Could not add transaction", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const CATEGORY_EMOJI: Record<string, string> = {
    food: "🍜", transport: "🚗", shopping: "🛍️",
    entertainment: "🎬", bills: "📋", savings: "💰", others: "📦",
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-10">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">Quick Add</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
            <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-xs text-green-700">AI will auto-categorise — just describe what you spent</p>
          </div>

          {/* Success state */}
          {added && (
            <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">{added.description}</p>
                <p className="text-xs text-green-700">RM{added.amount.toFixed(2)} · {CATEGORY_EMOJI[added.category]} {added.category}</p>
              </div>
            </div>
          )}

          <textarea
            className="w-full bg-gray-50 rounded-xl p-3.5 text-sm outline-none resize-none border border-gray-200 focus:border-green-400 transition-colors"
            rows={3}
            placeholder={"e.g. \"Nasi lemak RM12\"\n\"Zus Coffee RM15\"\n\"Grab to office RM8\""}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
            autoFocus
          />

          {/* Demo suggestions */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {DEMO_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleAdd(s)}
                  disabled={loading}
                  className="text-xs bg-gray-100 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 rounded-full px-3 py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleAdd()}
            disabled={loading || !input.trim()}
            className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 text-base"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add Transaction"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
