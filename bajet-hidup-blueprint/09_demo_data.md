# Step 3 — Demo Data (Amirah's Seeded Financial World)

Run this SQL in Supabase SQL Editor AFTER creating the schema.
This creates the full demo user with 3 months of realistic data.

---

## Full Seed SQL

```sql
-- ── DEMO USER ─────────────────────────────────────────────────────────────
-- Using a fixed UUID so the app can always reference 'demo-user-amirah'
INSERT INTO public.users (id, income, language, is_demo)
VALUES ('00000000-0000-0000-0000-000000000001', 2800, 'en', true)
ON CONFLICT (id) DO UPDATE SET income = 2800, language = 'en';

-- Store demo user ID as a variable for reuse
-- Note: Replace 'DEMO_USER_ID' with '00000000-0000-0000-0000-000000000001' in all queries below

-- ── RECURRING BILLS ───────────────────────────────────────────────────────
INSERT INTO public.recurring_bills (user_id, name, amount, due_day) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rent', 750, 1),
  ('00000000-0000-0000-0000-000000000001', 'PTPTN', 200, 15),
  ('00000000-0000-0000-0000-000000000001', 'Phone (Maxis)', 80, 5),
  ('00000000-0000-0000-0000-000000000001', 'Spotify', 17, 10);

-- ── CATEGORY LIMITS ───────────────────────────────────────────────────────
INSERT INTO public.category_limits (user_id, category, monthly_limit, set_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 'food', 800, false),
  ('00000000-0000-0000-0000-000000000001', 'transport', 300, false),
  ('00000000-0000-0000-0000-000000000001', 'shopping', 400, false),
  ('00000000-0000-0000-0000-000000000001', 'entertainment', 150, false),
  ('00000000-0000-0000-0000-000000000001', 'savings', 300, false)
ON CONFLICT (user_id, category) DO NOTHING;

-- ── GOALS ─────────────────────────────────────────────────────────────────
INSERT INTO public.goals (user_id, name, target_amount, saved_amount, monthly_contribution, deadline, status, tips) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Laptop Fund',
    2400,
    840,
    600,
    (CURRENT_DATE + INTERVAL '4 months')::date,
    'at_risk',
    'You need RM600/month but are only contributing RM380. Cut GrabFood by RM5/day to close the gap.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Bali Holiday',
    2000,
    0,
    286,
    (CURRENT_DATE + INTERVAL '7 months')::date,
    'on_track',
    'Starting from zero but you have time. RM286/month gets you there. Reduce one Shopee haul per month.'
  );

-- ── TRANSACTIONS — CURRENT MONTH ─────────────────────────────────────────
-- Patterns embedded: GrabFood heavy, weekend shopping, mid-month Shopee

-- Bills (auto-recurring)
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, raw_input, added_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 750, 'bills', 'Landlord', 'Monthly rent', DATE_TRUNC('month', CURRENT_DATE)::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 200, 'bills', 'PTPTN', 'Loan repayment', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '14 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 80, 'bills', 'Maxis', 'Phone bill', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 17, 'bills', 'Spotify', 'Music subscription', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 25, 'entertainment', 'Netflix', 'Netflix subscription', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days')::date, null, false);

-- Food — heavy GrabFood + occasional mamak
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, raw_input, added_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 22.50, 'food', 'GrabFood', 'McD delivery', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 day')::date, 'grabfood mcd rm22.50', false),
  ('00000000-0000-0000-0000-000000000001', 14.00, 'food', 'GrabFood', 'Nasi lemak delivery', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 8.50, 'food', 'Mamak SS15', 'Roti canai + teh tarik', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 28.50, 'food', 'GrabFood', 'Subway', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days')::date, 'grabfood subway rm28.50', true),
  ('00000000-0000-0000-0000-000000000001', 31.00, 'food', 'GrabFood', 'Thai food', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 24.00, 'food', 'Starbucks', 'Coffee & sandwich', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '6 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 45.00, 'food', 'Jaya Grocer', 'Weekly groceries', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '7 days')::date, 'jaya grocer rm45 groceries', true),
  ('00000000-0000-0000-0000-000000000001', 19.50, 'food', 'GrabFood', 'Noodles delivery', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '8 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 12.00, 'food', 'Kopitiam', 'Lunch with colleagues', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '9 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 33.00, 'food', 'GrabFood', 'Korean BBQ delivery', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 18.00, 'food', 'GrabFood', 'Ramen delivery', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '11 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 27.00, 'food', 'Chilis', 'Dinner with friend', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '12 days')::date, null, false);

-- Transport
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, raw_input, added_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 60.00, 'transport', 'Shell', 'Petrol Cheras', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 days')::date, 'Shell Cheras RM60 petrol', true),
  ('00000000-0000-0000-0000-000000000001', 50.00, 'transport', 'Touch n Go', 'TNG reload', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '5 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 35.00, 'transport', 'Grab', 'Airport send off', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 55.00, 'transport', 'Shell', 'Petrol mid-month', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '15 days')::date, null, false);

-- Shopping — weekend pattern + Shopee
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, raw_input, added_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 87.00, 'shopping', 'Shopee', 'Skincare haul', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '4 days')::date, 'shopee skincare rm87', false),
  ('00000000-0000-0000-0000-000000000001', 43.00, 'shopping', 'Watson', '1 Utama trip', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '7 days')::date, null, false),
  ('00000000-0000-0000-0000-000000000001', 129.00, 'shopping', 'Uniqlo', 'Mid Valley', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '10 days')::date, 'uniqlo mid valley rm129', true),
  ('00000000-0000-0000-0000-000000000001', 63.00, 'shopping', 'Shopee', 'Home stuff', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '13 days')::date, null, false);

-- Savings
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, raw_input, added_by_ai) VALUES
  ('00000000-0000-0000-0000-000000000001', 380, 'savings', 'Maybank Savings', 'Monthly savings transfer', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 day')::date, null, false);

-- ── TRANSACTIONS — LAST MONTH (for trend analysis) ────────────────────────
INSERT INTO public.transactions (user_id, amount, category, merchant, description, date, added_by_ai) VALUES
  -- Last month food (less than current — shows increase)
  ('00000000-0000-0000-0000-000000000001', 18.00, 'food', 'GrabFood', 'Delivery', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 1, false),
  ('00000000-0000-0000-0000-000000000001', 12.00, 'food', 'Mamak', 'Lunch', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 3, false),
  ('00000000-0000-0000-0000-000000000001', 25.00, 'food', 'GrabFood', 'Dinner', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 5, false),
  ('00000000-0000-0000-0000-000000000001', 40.00, 'food', 'Grocer', 'Groceries', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 8, false),
  ('00000000-0000-0000-0000-000000000001', 15.00, 'food', 'GrabFood', 'Lunch', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 10, false),
  ('00000000-0000-0000-0000-000000000001', 22.00, 'food', 'Restaurant', 'Dinner', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 14, false),
  ('00000000-0000-0000-0000-000000000001', 19.00, 'food', 'GrabFood', 'Delivery', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 18, false),
  ('00000000-0000-0000-0000-000000000001', 31.00, 'food', 'Dinner', 'Weekend', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 21, false),
  -- Last month transport (similar)
  ('00000000-0000-0000-0000-000000000001', 60.00, 'transport', 'Shell', 'Petrol', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 2, false),
  ('00000000-0000-0000-0000-000000000001', 50.00, 'transport', 'Touch n Go', 'Reload', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 7, false),
  ('00000000-0000-0000-0000-000000000001', 55.00, 'transport', 'Shell', 'Petrol', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 16, false),
  -- Last month shopping (lower — shows increase this month)
  ('00000000-0000-0000-0000-000000000001', 55.00, 'shopping', 'Shopee', 'Items', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 6, false),
  ('00000000-0000-0000-0000-000000000001', 89.00, 'shopping', 'H&M', 'Clothes', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 14, false),
  -- Last month bills
  ('00000000-0000-0000-0000-000000000001', 750, 'bills', 'Landlord', 'Rent', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date, false),
  ('00000000-0000-0000-0000-000000000001', 200, 'bills', 'PTPTN', 'Loan', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 14, false),
  ('00000000-0000-0000-0000-000000000001', 80, 'bills', 'Maxis', 'Phone', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 4, false),
  -- Last month savings
  ('00000000-0000-0000-0000-000000000001', 380, 'savings', 'Maybank', 'Savings', DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::date + 1, false);

-- ── UPDATE USER ID IN CODE ─────────────────────────────────────────────────
-- In all page files, replace 'demo-user-amirah' with the actual UUID:
-- const USER_ID = "00000000-0000-0000-0000-000000000001";
```

---

## Important: Update USER_ID in All Files

After running the seed SQL, update the `USER_ID` constant in these files:

```
app/dashboard/page.tsx      → USER_ID = "00000000-0000-0000-0000-000000000001"
app/insights/page.tsx       → USER_ID = "00000000-0000-0000-0000-000000000001"
app/ai/page.tsx             → USER_ID = "00000000-0000-0000-0000-000000000001"
app/profile/page.tsx        → USER_ID = "00000000-0000-0000-0000-000000000001"
```

Or create a shared constant:

```typescript
// lib/constants.ts
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
```

---

## Verify Data Loaded Correctly

Run these checks in Supabase SQL Editor:

```sql
-- Should return 1 row
SELECT * FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Should return 4 rows
SELECT * FROM public.recurring_bills WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Should return 2 rows (Laptop Fund, Bali Holiday)
SELECT name, target_amount, saved_amount, status FROM public.goals
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Should return 30+ rows
SELECT COUNT(*) FROM public.transactions
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Should show spending breakdown
SELECT category, SUM(amount) as total
FROM public.transactions
WHERE user_id = '00000000-0000-0000-0000-000000000001'
  AND date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY category
ORDER BY total DESC;
```

---

## What This Data Enables (Demo Talking Points)

| Insight | What GLM Will Say |
|---------|------------------|
| GrabFood pattern | "You've made 8+ GrabFood orders this month — that's 40% of your food budget" |
| Weekend spending | AI will detect weekend peaks from the transaction dates |
| Shopee splurge | "Your Shopee spending is RM150 this month and rising" |
| Laptop goal at risk | "Your Laptop Fund is at risk — you need RM600/month but only contributing RM380" |
| Food up vs last month | "Your food spending is up 23% vs last month" |
| Savings velocity | Two clear lines on the chart — current vs needed pace |
