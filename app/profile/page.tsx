"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { DEMO_USER_ID } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, DollarSign, Receipt, Sliders, Bot,
  ChevronRight, Pencil, Check, X, Wallet,
  Target, TrendingUp, Shield,
} from "lucide-react";

export default function ProfilePage() {
  const [income, setIncome] = useState("");
  const [editingIncome, setEditingIncome] = useState(false);
  const [language, setLanguage] = useState("en");
  const [bills, setBills] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const [userRes, billsRes, limitsRes, goalsRes, txRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", DEMO_USER_ID).single(),
      supabase.from("recurring_bills").select("*").eq("user_id", DEMO_USER_ID).order("due_day"),
      supabase.from("category_limits").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("goals").select("*").eq("user_id", DEMO_USER_ID),
      supabase.from("transactions").select("amount").eq("user_id", DEMO_USER_ID).gte("date", startOfMonth),
    ]);
    setIncome(userRes.data?.income?.toString() ?? "");
    setLanguage(userRes.data?.language ?? "en");
    setBills(billsRes.data ?? []);
    setLimits(limitsRes.data ?? []);
    setGoals(goalsRes.data ?? []);
    const spent = (txRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0);
    setTotalSpent(spent);
  }

  async function saveIncome() {
    const parsed = parseFloat(income);
    if (isNaN(parsed)) return;
    await supabase.from("users").update({ income: parsed }).eq("id", DEMO_USER_ID);
    setEditingIncome(false);
    toast({ title: "Income updated ✓" });
  }

  async function saveLanguage(lang: string) {
    setLanguage(lang);
    await supabase.from("users").update({ language: lang }).eq("id", DEMO_USER_ID);
    toast({ title: `Language set to ${lang === "en" ? "English" : "Bahasa Malaysia"} ✓` });
  }

  const incomeNum = parseFloat(income) || 0;
  const savingsRate = incomeNum > 0 ? Math.max(0, Math.round(((incomeNum - totalSpent) / incomeNum) * 100)) : 0;

  return (
    <AppShell activeTab="profile">
      <div className="pb-24 bg-gray-50 min-h-screen">

        {/* Hero header */}
        <div className="bg-green-600 pt-12 pb-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-white" />
            <div className="absolute bottom-0 left-8 w-20 h-20 rounded-full bg-white" />
          </div>
          <div className="flex items-center gap-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-white">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Amirah</h1>
              <p className="text-sm text-green-100">Demo Account · BajetHidup</p>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mx-4 -mt-10 bg-white rounded-2xl shadow-md border border-gray-100 grid grid-cols-3 divide-x divide-gray-100 relative">
          <StatItem icon={<Wallet className="w-4 h-4 text-green-600" />} label="Income" value={incomeNum > 0 ? `RM${incomeNum.toLocaleString()}` : "—"} />
          <StatItem icon={<TrendingUp className="w-4 h-4 text-blue-500" />} label="Saved" value={`${savingsRate}%`} />
          <StatItem icon={<Target className="w-4 h-4 text-purple-500" />} label="Goals" value={`${goals.length}`} />
        </div>

        <div className="px-4 pt-5 space-y-4">

          {/* Income */}
          <Section title="Monthly Income" icon={<DollarSign className="w-4 h-4" />} iconBg="bg-green-50" iconColor="text-green-600">
            <div className="flex items-center justify-between">
              {editingIncome ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 border border-green-400">
                    <span className="text-gray-500 text-sm font-medium">RM</span>
                    <input
                      type="number"
                      value={income}
                      onChange={e => setIncome(e.target.value)}
                      className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                      autoFocus
                      onKeyDown={e => e.key === "Enter" && saveIncome()}
                    />
                  </div>
                  <button onClick={saveIncome} className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </button>
                  <button onClick={() => setEditingIncome(false)} className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {incomeNum > 0 ? `RM ${incomeNum.toLocaleString()}` : "Not set"}
                    </p>
                    <p className="text-xs text-gray-400">Take-home monthly salary</p>
                  </div>
                  <button
                    onClick={() => setEditingIncome(true)}
                    className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                </>
              )}
            </div>
          </Section>

          {/* Language */}
          <Section title="Language" icon={<Globe className="w-4 h-4" />} iconBg="bg-blue-50" iconColor="text-blue-600">
            <div className="flex gap-2">
              {[
                { code: "en", label: "🇬🇧 English" },
                { code: "bm", label: "🇲🇾 Bahasa" },
              ].map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => saveLanguage(code)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    language === code
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          {/* AI-set Limits */}
          <Section
            title="Spending Limits"
            icon={<Sliders className="w-4 h-4" />}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
            badge={limits.length > 0 ? `${limits.length} active` : undefined}
          >
            {limits.length === 0 ? (
              <EmptyState text="No limits yet — ask the AI to set one for you" />
            ) : (
              <div className="space-y-2">
                {limits.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-800 capitalize font-medium">{l.category}</span>
                      {l.set_by_ai && (
                        <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          <Bot className="w-3 h-3" /> AI
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">RM{l.monthly_limit}/mo</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Recurring Bills */}
          <Section
            title="Recurring Bills"
            icon={<Receipt className="w-4 h-4" />}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
            badge={bills.length > 0 ? `${bills.length} bills` : undefined}
          >
            {bills.length === 0 ? (
              <EmptyState text="No bills added yet" />
            ) : (
              <div className="space-y-2">
                {bills.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-400">Due day {b.due_day} each month</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">RM{b.amount}</span>
                  </div>
                ))}
              </div>
            )}
            <AddBillForm userId={DEMO_USER_ID} onAdded={loadData} />
          </Section>

          {/* Demo badge */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Demo Mode</p>
              <p className="text-xs text-amber-600 mt-0.5">{"Using Amirah's sample data. All AI features are fully live."}</p>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center py-4 px-2">
      <div className="mb-1">{icon}</div>
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function Section({
  title, icon, iconBg, iconColor, children, badge
}: {
  title: string; icon: React.ReactNode; iconBg: string; iconColor: string;
  children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
        </div>
        {badge && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-xs text-gray-400 text-center py-3">{text}</p>;
}

function AddBillForm({ userId, onAdded }: { userId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");

  async function add() {
    if (!name.trim() || !amount) return;
    await supabase.from("recurring_bills").insert({
      user_id: userId, name: name.trim(),
      amount: parseFloat(amount), due_day: parseInt(dueDay),
    });
    setName(""); setAmount(""); setDueDay("1"); setOpen(false);
    onAdded();
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full text-xs text-green-600 font-medium py-2 border border-dashed border-green-200 rounded-xl hover:bg-green-50 transition-colors mt-2"
    >
      + Add recurring bill
    </button>
  );

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2 mt-2">
      <input
        className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none focus:border-green-400 transition-colors"
        placeholder="e.g. PTPTN, Unifi, Netflix"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <div className="flex gap-2">
        <input
          className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none focus:border-green-400 transition-colors"
          placeholder="Amount (RM)"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
        <input
          className="w-20 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none focus:border-green-400 transition-colors"
          placeholder="Day"
          type="number"
          min={1} max={31}
          value={dueDay}
          onChange={e => setDueDay(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={add} className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-green-700">Add</button>
        <button onClick={() => setOpen(false)} className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 rounded-lg hover:bg-gray-200">Cancel</button>
      </div>
    </div>
  );
}
