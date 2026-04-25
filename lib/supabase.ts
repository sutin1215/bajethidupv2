import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-safe Supabase instance — safe to use in client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── TYPED QUERY HELPERS ────────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function getRecurringBills(userId: string) {
  const { data } = await supabase
    .from("recurring_bills")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getCategoryLimits(userId: string) {
  const { data } = await supabase
    .from("category_limits")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getTransactionsThisMonth(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startOfMonth)
    .order("date", { ascending: false });
  return data ?? [];
}

export async function getGoals(userId: string) {
  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getRecentTransactions(userId: string, limit = 15) {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getTransactionsByDay(userId: string, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .gte("date", from.toISOString().split("T")[0])
    .order("date", { ascending: true });
  return data ?? [];
}

export async function getInsightsCache(userId: string, type: string) {
  const { data } = await supabase
    .from("insights_cache")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}
