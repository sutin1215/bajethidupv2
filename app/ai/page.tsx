"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DEMO_USER_ID } from "@/lib/constants";
import AppShell from "@/components/layout/AppShell";
import ChatBubble from "@/components/ai/ChatBubble";
import DecisionCard from "@/components/ai/DecisionCard";
import GoalPreviewCard from "@/components/ai/GoalPreviewCard";
import ContextBar from "@/components/ai/ContextBar";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SUGGESTED_PROMPTS = [
  "Can I afford something this month?",
  "Help me set a new goal",
  "What should I cut to save more?",
  "Show me my spending patterns",
];

// ALL context → opening message mappings (must be exhaustive)
const CONTEXT_MESSAGES: Record<string, string> = {
  today_vs_yesterday: "I noticed something about my today vs yesterday spending — can you explain it?",
  weekly_trend: "Tell me more about my 7-day spending trend and what it means.",
  weekend_spender: "Tell me about my weekend spending pattern and how to improve it.",
  grabfood_reliant: "I seem to rely on GrabFood a lot. Help me understand the impact and what to do.",
  shopee_splurger: "I'm apparently a Shopee splurger. Show me the numbers and help me fix it.",
  active_saver: "Tell me more about my saving habits and how to make them even better.",
  weekly_summary: "Let's talk about this week's financial summary and what I should focus on.",
  burn_rate: "Tell me about my monthly burn rate — am I on track or overspending?",
  savings_velocity: "How is my savings velocity? Am I on track to hit my goals?",
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
  // Guard: only auto-send the context message once
  const hasSentInitial = useRef(false);

  useEffect(() => {
    loadContextData();

    const welcome: Message = {
      role: "assistant",
      content: "Hey! I'm your BajetHidup AI advisor. I know your finances inside out. Ask me anything — or tap a suggestion below to get started. 💚",
      timestamp: new Date().toISOString(),
    };

    // Always start with just the welcome message
    setMessages([welcome]);

    if (context && !hasSentInitial.current) {
      hasSentInitial.current = true;

      let openingMessage = CONTEXT_MESSAGES[context] ?? "";

      if (context.startsWith("goal_") && goalName) {
        openingMessage = `My "${goalName}" goal is at risk. Help me get it back on track.`;
      }
      if (context === "whatif") {
        const cat = searchParams.get("category");
        const amt = searchParams.get("amount");
        openingMessage = `Tell me more about what happens if I cut ${cat} spending by RM${amt}/month.`;
      }
      if (context.startsWith("category_")) {
        const cat = context.replace("category_", "");
        openingMessage = `Tell me about my ${cat} spending — how am I doing and what should I change?`;
      }

      if (openingMessage) {
        // Delay so welcome renders first, then auto-send ONCE
        setTimeout(() => {
          sendMessage(openingMessage, [welcome]);
        }, 400);
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadContextData() {
    const [userRes, limRes, goalsRes] = await Promise.all([
      supabase.from("users").select("income, language").eq("id", DEMO_USER_ID).single(),
      supabase.from("category_limits").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("goals").select("name, status").eq("user_id", DEMO_USER_ID),
    ]);
    setContextData({
      income: userRes.data?.income,
      limits: limRes.data ?? [],
      goals: goalsRes.data ?? [],
    });
  }

  // Accept optional currentMessages to avoid stale closure on auto-send
  async function sendMessage(text?: string, currentMessages?: Message[]) {
    const content = text ?? input.trim();
    if (!content || loading) return;

    setInput("");
    const userMsg: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const baseMessages = currentMessages ?? messages;
    setMessages(prev => currentMessages ? [...currentMessages, userMsg] : [...prev, userMsg]);
    setLoading(true);

    try {
      const history = [...baseMessages, userMsg]
        .filter(m => !(m.role === "assistant" && m.content.startsWith("Hey! I'm your BajetHidup")))
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEMO_USER_ID, messages: history }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      const assistantMsg: Message = {
        role: "assistant",
        content: data.message || "I couldn't generate a response. Please try again.",
        timestamp: new Date().toISOString(),
        decision_card: data.decision_card ?? undefined,
        goal_preview: data.goal_preview ?? undefined,
        action_taken: data.action?.type ?? undefined,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I had trouble connecting. Please check your connection and try again.",
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
      <div className="flex flex-col h-[100dvh] pb-16">

        <div className="px-4 pt-4 pb-2 flex-shrink-0">
          <ContextBar contextData={contextData} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <ChatBubble message={msg} />
              {msg.decision_card && (
                <DecisionCard
                  card={msg.decision_card}
                  userId={DEMO_USER_ID}
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
                  userId={DEMO_USER_ID}
                  onAdded={(name) => {
                    setMessages(prev => [...prev, {
                      role: "assistant",
                      content: `Your "${name}" goal has been added! I'll keep track of it for you. 🎯`,
                      timestamp: new Date().toISOString(),
                    }]);
                    loadContextData();
                  }}
                />
              )}
              {msg.action_taken && (
                <div className="flex items-center gap-1.5 ml-10 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-green-600 font-medium">
                    {msg.action_taken === "LOG_TRANSACTION" && "Transaction logged to your dashboard"}
                    {msg.action_taken === "SET_CATEGORY_LIMIT" && "Spending limit updated"}
                    {msg.action_taken === "CREATE_GOAL" && "Goal created"}
                    {msg.action_taken === "UPDATE_GOAL" && "Goal updated"}
                  </span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 pl-10">
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {showSuggestions && (
            <div className="space-y-2 mt-2">
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="w-full text-left text-sm bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl px-3.5 py-2.5 text-gray-700 transition-colors shadow-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-3 flex-shrink-0">
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
