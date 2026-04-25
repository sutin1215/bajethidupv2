import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export const MARTIN_ID = "00000000-0000-0000-0000-000000000002";

export async function GET() {
  try {
    // 1. Create User
    await supabaseAdmin.from("users").upsert({
      id: MARTIN_ID,
      email: "martin@example.com",
      name: "Martin Edwards",
      income: 12000,
      language: "en"
    });

    // 2. Clear old data for idempotency
    await supabaseAdmin.from("transactions").delete().eq("user_id", MARTIN_ID);
    await supabaseAdmin.from("category_limits").delete().eq("user_id", MARTIN_ID);
    await supabaseAdmin.from("goals").delete().eq("user_id", MARTIN_ID);
    await supabaseAdmin.from("recurring_bills").delete().eq("user_id", MARTIN_ID);

    // 3. Insert Limits
    await supabaseAdmin.from("category_limits").insert([
      { user_id: MARTIN_ID, category: "food", monthly_limit: 2500, set_by_ai: false },
      { user_id: MARTIN_ID, category: "transport", monthly_limit: 1500, set_by_ai: false },
      { user_id: MARTIN_ID, category: "shopping", monthly_limit: 3000, set_by_ai: true },
      { user_id: MARTIN_ID, category: "entertainment", monthly_limit: 1000, set_by_ai: false }
    ]);

    // 4. Insert Goals
    await supabaseAdmin.from("goals").insert([
      {
        user_id: MARTIN_ID,
        name: "Porsche 911 Downpayment",
        target_amount: 80000,
        saved_amount: 45000,
        monthly_contribution: 2500,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 12).toISOString(),
        status: "active"
      },
      {
        user_id: MARTIN_ID,
        name: "Rolex Submariner",
        target_amount: 45000,
        saved_amount: 12000,
        monthly_contribution: 1500,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 24).toISOString(),
        status: "active"
      }
    ]);

    // 5. Insert Bills
    await supabaseAdmin.from("recurring_bills").insert([
      { user_id: MARTIN_ID, name: "Condo Rent", amount: 4500, due_day: 1 },
      { user_id: MARTIN_ID, name: "Car Lease", amount: 1800, due_day: 5 },
      { user_id: MARTIN_ID, name: "Gym Membership", amount: 450, due_day: 15 }
    ]);

    // 6. Insert Transactions (Recent)
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    await supabaseAdmin.from("transactions").insert([
      { user_id: MARTIN_ID, date: dates[0], amount: 450, category: "food", description: "Omakase Dinner", merchant: "Sushi Oribe", source: "bank" },
      { user_id: MARTIN_ID, date: dates[0], amount: 120, category: "transport", description: "Premium Petrol", merchant: "Shell", source: "bank" },
      { user_id: MARTIN_ID, date: dates[1], amount: 1200, category: "shopping", description: "Sneakers", merchant: "Nike KL", source: "bank" },
      { user_id: MARTIN_ID, date: dates[2], amount: 350, category: "entertainment", description: "Golf Green Fee", merchant: "TPC KL", source: "bank" },
      { user_id: MARTIN_ID, date: dates[3], amount: 85, category: "food", description: "Business Lunch", merchant: "Grand Hyatt", source: "bank" },
      { user_id: MARTIN_ID, date: dates[4], amount: 2500, category: "shopping", description: "Suit Tailoring", merchant: "Bespoke KL", source: "bank" },
      { user_id: MARTIN_ID, date: dates[5], amount: 150, category: "food", description: "Wine", merchant: "Cellar", source: "bank" },
      { user_id: MARTIN_ID, date: dates[6], amount: 4500, category: "bills", description: "Condo Rent", merchant: "Property Mgmt", source: "bank" }
    ]);

    return NextResponse.json({ success: true, message: "Martin seeded!" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
