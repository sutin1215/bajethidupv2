import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));

const supabaseAdmin = createClient(
  envConfig.NEXT_PUBLIC_SUPABASE_URL,
  envConfig.SUPABASE_SERVICE_ROLE_KEY
);

const MARTIN_ID = "00000000-0000-0000-0000-000000000002";

async function run() {
  console.log("Seeding Martin...");
  
  const { error: userErr } = await supabaseAdmin.from("users").upsert({
    id: MARTIN_ID,
    income: 12000,
    language: "en"
  });
  if (userErr) console.error("User Err:", userErr);

  await supabaseAdmin.from("category_limits").delete().eq("user_id", MARTIN_ID);
  await supabaseAdmin.from("transactions").delete().eq("user_id", MARTIN_ID);
  await supabaseAdmin.from("goals").delete().eq("user_id", MARTIN_ID);
  await supabaseAdmin.from("recurring_bills").delete().eq("user_id", MARTIN_ID);

  const { error: limErr } = await supabaseAdmin.from("category_limits").upsert([
    { user_id: MARTIN_ID, category: "food", monthly_limit: 2500, set_by_ai: false },
    { user_id: MARTIN_ID, category: "transport", monthly_limit: 1500, set_by_ai: false },
    { user_id: MARTIN_ID, category: "shopping", monthly_limit: 3000, set_by_ai: true },
    { user_id: MARTIN_ID, category: "entertainment", monthly_limit: 1000, set_by_ai: false },
    { user_id: MARTIN_ID, category: "bills", monthly_limit: 6000, set_by_ai: false }
  ]);
  if (limErr) console.error("Limits Err:", limErr);

  const { error: goalsErr } = await supabaseAdmin.from("goals").upsert([
    {
      user_id: MARTIN_ID,
      name: "Porsche 911 Downpayment",
      target_amount: 80000,
      saved_amount: 45000,
      monthly_contribution: 2500,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 12).toISOString(),
      status: "on_track"
    },
    {
      user_id: MARTIN_ID,
      name: "Rolex Submariner",
      target_amount: 45000,
      saved_amount: 12000,
      monthly_contribution: 1500,
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 24).toISOString(),
      status: "on_track"
    }
  ]);
  if (goalsErr) console.error("Goals Err:", goalsErr);

  const { error: billsErr } = await supabaseAdmin.from("recurring_bills").upsert([
    { user_id: MARTIN_ID, name: "Condo Rent", amount: 4500, due_day: 1 },
    { user_id: MARTIN_ID, name: "Car Lease", amount: 1800, due_day: 5 },
    { user_id: MARTIN_ID, name: "Gym Membership", amount: 450, due_day: 15 }
  ]);
  if (billsErr) console.error("Bills Err:", billsErr);

  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  const { error: txErr } = await supabaseAdmin.from("transactions").upsert([
    { user_id: MARTIN_ID, date: dates[0], amount: 450, category: "food", description: "Omakase Dinner", merchant: "Sushi Oribe" },
    { user_id: MARTIN_ID, date: dates[0], amount: 120, category: "transport", description: "Premium Petrol", merchant: "Shell" },
    { user_id: MARTIN_ID, date: dates[1], amount: 1200, category: "shopping", description: "Sneakers", merchant: "Nike KL" },
    { user_id: MARTIN_ID, date: dates[2], amount: 350, category: "entertainment", description: "Golf Green Fee", merchant: "TPC KL" },
    { user_id: MARTIN_ID, date: dates[3], amount: 85, category: "food", description: "Business Lunch", merchant: "Grand Hyatt" },
    { user_id: MARTIN_ID, date: dates[4], amount: 2500, category: "shopping", description: "Suit Tailoring", merchant: "Bespoke KL" },
    { user_id: MARTIN_ID, date: dates[5], amount: 150, category: "food", description: "Wine", merchant: "Cellar" },
    { user_id: MARTIN_ID, date: dates[6], amount: 4500, category: "bills", description: "Condo Rent", merchant: "Property Mgmt" }
  ]);
  if (txErr) console.error("Tx Err:", txErr);

  console.log("Done seeding!");
}

run();
