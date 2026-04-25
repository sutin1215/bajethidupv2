# Step 8 — Page 3: AI Negotiator

Route: `/ai`

This is the star of the show. The AI reads and writes user data.
Goals are born here. Limits are set here. Trade-offs are resolved here.

---

## app/ai/page.tsx

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ChatBubble from "@/components/ai/ChatBubble";
import DecisionCard from "@/components/ai/DecisionCard";
import GoalPreviewCard from "@/components/ai/GoalPreviewCard";
import ContextBar from "@/components/ai/ContextBar";
import { Loader2, Send, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

const USER_ID = "demo-user-amirah";

// Context-aware suggested prompts
const SUGGESTED_PROMPTS = [
  "Can I afford something this month?",
  "Help me set a new goal",
  "What should I cut to save more?",
  "Show me my spending patterns",
];

// Context → opening message mapping
const CONTEXT_MESSAGES: Record<string, string> = {
  today_vs_yesterday: "I noticed something about my today vs yesterday spending — can you explain it?",
  weekly_trend: "Tell me more about my 7-day spending trend and what it means.",
  weekend_spender: "Tell me about my weekend spending pattern and how to improve it.",
  grabfood_reliant: "I seem to rely on GrabFood a lot. Help me understand the impact and what to do.",
  shopee_splurger: "I'm apparently a Shopee splurger. Show me the numbers and help me fix it.",
  active_saver: "Tell me more about my saving habits and how to make them even better.",
  weekly_summary: "Let's talk about this week's financial summary and what I should focus on.",
  whatif: "", // built dynamically
};

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  decision_card?: any;
  goal_preview?: any;
  action_taken?: string;
}

export default function AiPage() {
  const searchParams = useSearchParams();
  const context = searchParams.get("context");
  const goalName = searchParams.get("goal");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextData, setContextData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load context and optionally pre-send an opening message
  useEffect(() => {
    loadContextData();

    if (context) {
      let openingMessage = CONTEXT_MESSAGES[context] ?? "";

      // Dynamic context messages
      if (context.startsWith("goal_") && goalName) {
        openingMessage = `My "${goalName}" goal is at risk. Help me get it back on track.`;
      }
      if (context === "whatif") {
        const cat = searchParams.get("category");
        const amt = searchParams.get("amount");
        openingMessage = `Tell me more about what happens if I cut ${cat} spending by RM${amt}/month.`;
      }

      if (openingMessage) {
        // Small delay so context bar loads first
        setTimeout(() => sendMessage(openingMessage), 500);
      }
    } else {
      // Default welcome on first open
      setMessages([{
        role: "assistant",
        content: "Hey! I'm your BajetHidup AI advisor. I know your finances inside out. Ask me anything — or tap a suggestion below to get started. 💚",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadContextData() {
    const [userRes, limRes, goalsRes] = await Promise.all([
      supabase.from("users").select("income, language").eq("id", USER_ID).single(),
      supabase.from("category_limits").select("*").eq("user_id", USER_ID),
      supabase.from("goals").select("name, status").eq("user_id", USER_ID),
    ]);
    setContextData({
      income: userRes.data?.income,
      limits: limRes.data ?? [],
      goals: goalsRes.data ?? [],
    });
  }

  async function sendMessage(text?: string) {
    const content = text ?? input.trim();
    if (!content || loading) return;

    setInput("");
    const userMsg: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build message history (exclude the welcome message, keep last 10)
      const history = [...messages, userMsg]
        .filter(m => !(m.role === "assistant" && m.content.startsWith("Hey! I'm your BajetHidup")))
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, messages: history }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date().toISOString(),
        decision_card: data.decision_card ?? undefined,
        goal_preview: data.goal_preview ?? undefined,
        action_taken: data.action?.type ?? undefined,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I had trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <AppShell activeTab="ai">
      <div className="flex flex-col h-screen pb-16">

        {/* Context Bar */}
        <div className="px-4 pt-4 pb-2">
          <ContextBar contextData={contextData} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatBubble message={msg} />
              {msg.decision_card && (
                <DecisionCard
                  card={msg.decision_card}
                  userId={USER_ID}
                  onActionTaken={(desc) => {
                    setMessages(prev => [...prev, {
                      role: "assistant",
                      content: `Done! ${desc} ✓`,
                      timestamp: new Date().toISOString(),
                    }]);
                    loadContextData();
                  }}
                />
              )}
              {msg.goal_preview && (
                <GoalPreviewCard
                  preview={msg.goal_preview}
                  userId={USER_ID}
                  onAdded={(name) => {
                    setMessages(prev => [...prev, {
                      role: "assistant",
                      content: `Your "${name}" goal has been added to your Goals page! I'll keep track of it for you. 🎯`,
                      timestamp: new Date().toISOString(),
                    }]);
                    loadContextData();
                  }}
                />
              )}
              {msg.action_taken && (
                <div className="flex items-center gap-1.5 ml-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 font-medium">
                    {msg.action_taken === "LOG_TRANSACTION" && "Transaction logged"}
                    {msg.action_taken === "SET_CATEGORY_LIMIT" && "Limit set"}
                    {msg.action_taken === "CREATE_GOAL" && "Goal created"}
                    {msg.action_taken === "UPDATE_GOAL" && "Goal updated"}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex items-center gap-2 pl-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-xs text-gray-400">AI is thinking...</span>
            </div>
          )}

          {/* Suggested prompts */}
          {showSuggestions && (
            <div className="space-y-2 mt-2">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left text-sm bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl px-3.5 py-2.5 text-gray-700 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-100 bg-white px-4 py-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              className="flex-1 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm outline-none resize-none border border-gray-200 focus:border-green-400 transition-colors max-h-28"
              rows={1}
              placeholder="Ask anything about your money..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-green-700 active:scale-95 transition-all flex-shrink-0"
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className="w-4 h-4 text-white" />
              }
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
```

---

## components/ai/ChatBubble.tsx

```tsx
"use client";
import { Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Props {
  message: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  };
}

export default function ChatBubble({ message }: Props) {
  const isAi = message.role === "assistant";

  if (isAi) {
    return (
      <div className="flex gap-2.5 items-start">
        <div className="w-7 h-7 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="max-w-[85%]">
          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-1">
            {format(new Date(message.timestamp), "h:mm a")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[80%]">
        <div className="bg-green-600 rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm text-white leading-relaxed">{message.content}</p>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right mr-1">
          {format(new Date(message.timestamp), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
```

---

## components/ai/DecisionCard.tsx

```tsx
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
```

---

## components/ai/GoalPreviewCard.tsx

```tsx
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
```

---

## components/ai/ContextBar.tsx

```tsx
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
```
