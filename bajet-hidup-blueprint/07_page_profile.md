# Step 9 — Page 4: Profile & Settings

Route: `/profile`

---

## app/profile/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight, Trash2, Download, Globe, DollarSign, Receipt, Sliders, Bot } from "lucide-react";

const USER_ID = "demo-user-amirah";

export default function ProfilePage() {
  const [income, setIncome] = useState("");
  const [language, setLanguage] = useState("en");
  const [bills, setBills] = useState<any[]>([]);
  const [limits, setLimits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [userRes, billsRes, limitsRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", USER_ID).single(),
      supabase.from("recurring_bills").select("*").eq("user_id", USER_ID),
      supabase.from("category_limits").select("*").eq("user_id", USER_ID),
    ]);
    setIncome(userRes.data?.income?.toString() ?? "");
    setLanguage(userRes.data?.language ?? "en");
    setBills(billsRes.data ?? []);
    setLimits(limitsRes.data ?? []);
    setLoading(false);
  }

  async function saveIncome() {
    await supabase.from("users").update({ income: parseFloat(income) }).eq("id", USER_ID);
    toast({ title: "Income updated ✓" });
  }

  async function saveLanguage(lang: string) {
    setLanguage(lang);
    await supabase.from("users").update({ language: lang }).eq("id", USER_ID);
    toast({ title: `Language set to ${lang === "en" ? "English" : "Bahasa Malaysia"} ✓` });
  }

  return (
    <AppShell activeTab="profile">
      <div className="px-4 pt-6 pb-24 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your financial foundation — the AI uses this</p>
        </div>

        {/* Income */}
        <SettingSection icon={<DollarSign className="w-4 h-4" />} title="Monthly Income">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 border border-gray-200">
              <span className="text-gray-500 text-sm">RM</span>
              <input
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                className="flex-1 bg-transparent py-2.5 text-sm outline-none"
                placeholder="0.00"
              />
            </div>
            <button onClick={saveIncome}
              className="bg-green-600 text-white text-sm px-4 rounded-xl font-medium hover:bg-green-700">
              Save
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Take-home salary after EPF and tax</p>
        </SettingSection>

        {/* Language */}
        <SettingSection icon={<Globe className="w-4 h-4" />} title="Language">
          <div className="flex gap-2">
            {["en", "bm"].map(lang => (
              <button key={lang} onClick={() => saveLanguage(lang)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  language === lang
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {lang === "en" ? "🇬🇧 English" : "🇲🇾 Bahasa Malaysia"}
              </button>
            ))}
          </div>
        </SettingSection>

        {/* Recurring Bills */}
        <SettingSection icon={<Receipt className="w-4 h-4" />} title="Recurring Bills"
          subtitle="These are fixed — AI won't suggest cutting them">
          <div className="space-y-2">
            {bills.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-400">Due day {b.due_day}</p>
                </div>
                <p className="text-sm font-semibold text-gray-700">RM{b.amount}</p>
              </div>
            ))}
            <AddBillForm userId={USER_ID} onAdded={loadData} />
          </div>
        </SettingSection>

        {/* Category Limits */}
        <SettingSection icon={<Sliders className="w-4 h-4" />} title="Spending Limits">
          <div className="space-y-2">
            {limits.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">
                No limits set. Ask the AI to set one for you.
              </p>
            )}
            {limits.map(l => (
              <div key={l.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 capitalize">{l.category}</p>
                  {l.set_by_ai && (
                    <span className="flex items-center gap-0.5 text-xs text-green-600">
                      <Bot className="w-3 h-3" /> AI
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-700">RM{l.monthly_limit}/mo</p>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Demo Mode info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">📊 Demo Mode Active</p>
          <p className="text-xs text-amber-700">You're viewing Amirah's demo data. All AI features are fully functional with this data.</p>
        </div>
      </div>
    </AppShell>
  );
}

function SettingSection({ icon, title, subtitle, children }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function AddBillForm({ userId, onAdded }: any) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [open, setOpen] = useState(false);

  async function add() {
    if (!name || !amount) return;
    await supabase.from("recurring_bills").insert({
      user_id: userId, name, amount: parseFloat(amount), due_day: parseInt(dueDay),
    });
    setName(""); setAmount(""); setOpen(false);
    onAdded();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full text-xs text-green-600 font-medium py-2 border border-dashed border-green-300 rounded-xl hover:bg-green-50">
      + Add recurring bill
    </button>
  );

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <input className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none"
        placeholder="Bill name (e.g. PTPTN)" value={name} onChange={e => setName(e.target.value)} />
      <div className="flex gap-2">
        <input className="flex-1 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none"
          placeholder="RM amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <input className="w-20 bg-white rounded-lg px-3 py-2 text-sm border border-gray-200 outline-none"
          placeholder="Day" type="number" min={1} max={31} value={dueDay} onChange={e => setDueDay(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={add} className="flex-1 bg-green-600 text-white text-sm py-2 rounded-lg font-medium">Add</button>
        <button onClick={() => setOpen(false)} className="flex-1 bg-gray-100 text-gray-700 text-sm py-2 rounded-lg">Cancel</button>
      </div>
    </div>
  );
}
```
