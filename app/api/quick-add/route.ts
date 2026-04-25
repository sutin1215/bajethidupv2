import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

// Keyword-based category detector — fast, no AI needed
function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (/grab|food|makan|nasi|rice|burger|pizza|kfc|mcdo|mamak|kopitiam|cafe|coffee|zus|starbucks|teh|roti|lauk|mee|noodle|sushi|dim sum|lunch|dinner|breakfast|bfast|brunch/.test(t)) return "food";
  if (/grab ?car|myrapid|rapid|lrt|mrt|bus|ktm|taxi|grab ?ride|petrol|shell|petronas|parking|tol|toll|commute|train/.test(t)) return "transport";
  if (/shopee|lazada|zalora|uniqlo|zara|h&m|clothes|baju|kasut|shoes|shirt|dress|belt|bag|accessories|purchase|order/.test(t)) return "shopping";
  if (/netflix|spotify|cinema|movie|games|steam|concert|ticket|subscription|disney|youtube/.test(t)) return "entertainment";
  if (/celcom|maxis|digi|unifi|astro|electric|water|bill|sewa|rent|ptptn|insurance|loan/.test(t)) return "bills";
  if (/saving|tabung|asnb|epf|invest|fixed deposit/.test(t)) return "savings";
  return "others";
}

// Extract amount from text like "rm12", "rm 12", "12 ringgit", "12.50"
function extractAmount(text: string): number | null {
  const patterns = [
    /rm\s*(\d+(?:\.\d{1,2})?)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:rm|ringgit|myr)/i,
    /(\d+(?:\.\d{1,2})?)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

// Extract a clean description by removing the amount part
function extractDescription(text: string): string {
  return text
    .replace(/rm\s*\d+(?:\.\d{1,2})?/gi, "")
    .replace(/\d+(?:\.\d{1,2})?\s*(?:rm|ringgit|myr)/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    // Capitalise first letter
    .replace(/^./, c => c.toUpperCase()) || "Expense";
}

export async function POST(req: NextRequest) {
  try {
    const { userId, text } = await req.json();
    if (!userId || !text) {
      return NextResponse.json({ error: "Missing userId or text" }, { status: 400 });
    }

    const amount = extractAmount(text);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Could not detect an amount. Try: 'Nasi lemak RM12'" }, { status: 422 });
    }

    const description = extractDescription(text);
    const category = detectCategory(text);
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      description,
      amount,
      category,
      date: today,
      merchant: description,
    });

    if (error) throw error;

    return NextResponse.json({ success: true, description, amount, category });
  } catch (err: any) {
    console.error("Quick add error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to add" }, { status: 500 });
  }
}
