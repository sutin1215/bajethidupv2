# Step 1 — Tech Setup & Project Initialisation

---

## 1.1 Create Next.js Project

```bash
npx create-next-app@latest bajet-hidup \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd bajet-hidup
```

---

## 1.2 Install All Dependencies

```bash
# UI Components
npx shadcn@latest init
# When prompted: Style = Default, Base color = Green, CSS variables = Yes

# Install all shadcn components we need
npx shadcn@latest add button card badge sheet dialog progress tabs avatar separator skeleton toast

# Data visualisation
npm install @tremor/react

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Utilities
npm install clsx tailwind-merge lucide-react date-fns

# AI streaming
npm install ai
```

---

## 1.3 Configure Tailwind

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BajetHidup brand
        brand: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",  // PRIMARY
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 1.4 Update globals.css

In `app/globals.css`, ensure these CSS variables are set:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 142.1 76.2% 36.3%;       /* green-600 */
    --primary-foreground: 355.7 100% 97.3%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142.1 76.2% 36.3%;
    --radius: 0.75rem;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}

/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Hide scrollbar but keep scroll */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 1.5 Create lib/types.ts

This is the single source of truth for all TypeScript types.

```typescript
// lib/types.ts

export type Language = "en" | "bm";

export type Category =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "bills"
  | "savings"
  | "others";

export type GoalStatus = "on_track" | "at_risk" | "off_track";

export interface UserProfile {
  id: string;
  income: number;
  language: Language;
  created_at: string;
}

export interface RecurringBill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_day: number; // day of month 1-31
}

export interface CategoryLimit {
  id: string;
  user_id: string;
  category: Category;
  monthly_limit: number;
  set_by_ai: boolean;
  set_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: Category;
  merchant: string;
  description: string;
  date: string; // ISO date string
  raw_input: string | null;
  added_by_ai: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  deadline: string; // ISO date string
  status: GoalStatus;
  tips: string | null; // GLM-generated tips from goal creation conversation
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  summary: string | null;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface InsightsCache {
  id: string;
  user_id: string;
  type: "weekly_summary" | "pattern_labels" | "category_insights";
  content: Record<string, unknown>;
  generated_at: string;
}

// GLM Action Types — what the AI can write back to the app
export type GlmAction =
  | { type: "CREATE_GOAL"; payload: CreateGoalPayload }
  | { type: "UPDATE_GOAL"; payload: UpdateGoalPayload }
  | { type: "SET_CATEGORY_LIMIT"; payload: SetLimitPayload }
  | { type: "LOG_TRANSACTION"; payload: LogTransactionPayload }
  | { type: "UPDATE_GOAL_STATUS"; payload: UpdateGoalStatusPayload };

export interface CreateGoalPayload {
  name: string;
  target_amount: number;
  monthly_contribution: number;
  deadline: string;
  tips: string;
}

export interface UpdateGoalPayload {
  id: string;
  monthly_contribution?: number;
  deadline?: string;
  saved_amount?: number;
}

export interface SetLimitPayload {
  category: Category;
  monthly_limit: number;
}

export interface LogTransactionPayload {
  amount: number;
  category: Category;
  merchant: string;
  description: string;
  date: string;
  raw_input: string;
}

export interface UpdateGoalStatusPayload {
  id: string;
  status: GoalStatus;
}

// GLM Response — can be text, action, or both
export interface GlmResponse {
  message: string;          // always present — the chat text
  action?: GlmAction;       // optional — if GLM wants to write something
  decision_card?: DecisionCard; // optional — trade-off analysis
  goal_preview?: GoalPreview;   // optional — pre-filled goal ready to add
}

export interface DecisionCard {
  situation: string;
  options: DecisionOption[];
  recommendation: string;
  recommended_index: number;
}

export interface DecisionOption {
  label: string;
  trade_off: string;
  impact_on_goals: string;
  action?: GlmAction; // if user picks this option, execute this action
}

export interface GoalPreview {
  name: string;
  target_amount: number;
  monthly_contribution: number;
  deadline: string;
  tips: string;
  suggested_category_reduction?: {
    category: Category;
    reduce_by: number;
  };
}

// Financial context passed to GLM
export interface FinancialContext {
  user: {
    income: number;
    language: Language;
    discretionary: number; // income - sum of recurring bills
  };
  recurring_bills: RecurringBill[];
  category_limits: CategoryLimit[];
  current_month: {
    total_spent: number;
    by_category: Record<Category, number>;
    transactions: Transaction[];
    days_elapsed: number;
    days_remaining: number;
  };
  goals: Goal[];
  insights_flags: {
    categories_near_limit: Category[];    // >80% of limit spent
    categories_over_limit: Category[];   // >100% of limit spent
    goals_at_risk: string[];             // goal IDs
    projected_overspend: Record<Category, number>; // projected amount over limit
  };
}
```

---

## 1.6 Create lib/supabase.ts

```typescript
// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key — server only)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
```

---

## 1.7 Create app/layout.tsx

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BajetHidup — Runding, bukan sekadar rekod",
  description: "Your AI-powered life budget negotiator",
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---

## 1.8 Create app/page.tsx (Root Redirect)

```tsx
// app/page.tsx
import { redirect } from "next/navigation";

// Check if user has completed onboarding
// For hackathon: redirect to dashboard (demo mode always available)
export default function Home() {
  redirect("/dashboard");
}
```

---

## Checklist Before Moving to Step 2

- [ ] `npm run dev` runs without errors
- [ ] Tailwind green colours visible on `localhost:3000`
- [ ] All shadcn components installed (check `components/ui/` folder exists)
- [ ] `.env.local` created with all 5 environment variables
- [ ] `lib/types.ts` created with all types
- [ ] `lib/supabase.ts` created
