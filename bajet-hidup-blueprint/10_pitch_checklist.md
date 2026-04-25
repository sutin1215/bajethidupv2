# Step 10 — Pre-Demo QA Checklist & Pitch Guide

Run through every item on this list before presenting to judges.

---

## Part 1 — Technical QA

### Database
- [ ] All 7 Supabase tables exist
- [ ] Demo user `00000000-0000-0000-0000-000000000001` exists with income RM2,800
- [ ] 4 recurring bills seeded (Rent, PTPTN, Phone, Spotify)
- [ ] 2 goals seeded (Laptop Fund at_risk, Bali Holiday on_track)
- [ ] 30+ transactions seeded across 2 months
- [ ] 5 category limits seeded
- [ ] Realtime enabled on transactions, goals, category_limits

### Environment
- [ ] `.env.local` has all 5 variables set
- [ ] Z.AI API key is valid and has credits
- [ ] Supabase project is on free tier with sufficient quota
- [ ] Vercel deployment works (`vercel --prod` or `git push`)

### Home Page
- [ ] Health ring shows correct RM amount and percentage
- [ ] Category cards scroll horizontally
- [ ] AI Insight Card loads within 5 seconds
- [ ] Quick Add sheet opens and accepts text input
- [ ] Adding "GrabFood lunch RM18" logs a transaction and updates the feed
- [ ] Realtime update — transaction appears without page refresh

### Insights Page
- [ ] Today vs Yesterday chart renders with correct data
- [ ] Weekly trend shows 7 days of data
- [ ] Category intelligence cards expand on tap
- [ ] Goal progress shows Laptop at_risk (red/yellow) and Bali on_track (green)
- [ ] "Fix this with AI" button on Laptop goal navigates to AI page with context
- [ ] Pattern chips detect "GrabFood Reliant" from the demo data
- [ ] What-If Simulator runs and returns a GLM response
- [ ] Weekly Summary Card generates and displays all 3 sections
- [ ] "Tell me more" buttons navigate to AI page with correct context

### AI Page
- [ ] Welcome message appears on first open
- [ ] Suggested prompts display and send messages when tapped
- [ ] Context bar shows goals and income
- [ ] User messages appear right-aligned (green)
- [ ] GLM messages appear left-aligned (white card)
- [ ] Typing indicator shows during GLM processing
- [ ] **THE BIG TEST:** Type "I want to go to a Harry Styles concert, tickets RM280" → Decision Card appears with 3 options
- [ ] **GOAL TEST:** Type "I want to save for a new iPhone, RM3000, in 6 months" → Goal Preview Card appears → Tap "Add to My Goals" → Goal appears on Insights page
- [ ] **TRANSACTION TEST:** Type "I just spent RM45 at Jaya Grocer" → Transaction logged → appears on Home feed with AI badge
- [ ] **LIMIT TEST:** Type "Set my Shopee limit to RM200 this month" → Limit updated → visible on Profile page
- [ ] Context pre-loading works — navigate from Insights "Tell me more" → AI page opens with relevant first message

### Profile Page
- [ ] Income field shows RM2,800
- [ ] Language toggle switches between English and BM
- [ ] Recurring bills list shows all 4 bills
- [ ] Category limits list shows limits with AI badge where applicable
- [ ] Add bill form works

---

## Part 2 — Demo Script (10 Minutes)

### Minute 0:00–1:30 — The Problem (Don't rush this)
> "Meet Amirah. She's 24, earns RM2,800 a month as a marketing executive in PJ.
> She has PTPTN to pay, rent to cover, and she's trying to save for a laptop and a Bali trip.
> She's downloaded 3 budgeting apps. She abandoned all of them within a week.
> Not because she doesn't care about money. But because those apps just told her what she already knew — that she was overspending. They never told her what to actually DO about it.
> That's the gap. And that's what BajetHidup fills."

### Minute 1:30–3:30 — Product Tour (Fast, visual, confident)
**Home page:** "This is Amirah's wallet. At a glance — she's spent RM1,200 this month, 68% of her budget. The green ring is calm. The AI Insight Card at the top tells her the one thing she needs to know today."

**Insights page:** "This is where it gets interesting. This isn't a list. This is a financial intelligence dashboard, written fresh by AI from her actual data. Today vs yesterday. Her weekly trend. Category breakdowns that show she's up 23% on food vs last month. Her goals — notice the Laptop Fund is at risk. And down here — her What-If Simulator. Watch what happens."

*[Drag slider to cut Food by RM80. Hit Calculate.]*
> "Real GLM response, from her real data, in real time."

### Minute 3:30–7:00 — THE DEMO (This is your WOW moment. Slow down here.)

**Navigate to AI page.**

> "This is the AI Negotiator. And I want to show you something no budgeting app has ever done before."

*[Type: "I want to go to a Harry Styles concert next month. Tickets are RM280."]*

> "Watch what happens."

*[Wait for response. Decision Card appears.]*

> "The AI didn't just say 'you can't afford it.' It read Amirah's entire financial picture — her spending this month, her limits, her two active goals — and it came back with three actual options. Option A, B, and C. With the exact trade-offs for each. And a recommendation."

> "But here's the key — this isn't just advice. Watch this."

*[Type: "I already spent on Shopee this month though, Option A sounds better."]*

*[GLM recalculates and responds.]*

> "It just updated its reasoning based on new information, in real time. This is a negotiation. Not a chatbot."

*[Tap "Apply" on the recommended option.]*

> "And now — watch the Insights page."

*[Navigate to Insights — goal progress updated, limit updated.]*

> "The AI just wrote to the database. The dashboard updated. No form filled. No settings page. One conversation."

**Back to AI page. New conversation.**

*[Type: "I want to save for a new iPhone. It's RM3,500 and I want it in 5 months."]*

*[Goal Preview Card appears.]*

> "The AI calculated the monthly contribution needed, checked if it conflicts with existing goals, added its own tip — and now all Amirah has to do is tap one button."

*[Tap "Add to My Goals".]*

*[Navigate to Insights — new goal appears.]*

> "Goal created. From a conversation. No forms."

### Minute 7:00–8:00 — Technical Walkthrough (Show the judges the code)

**Open VS Code / editor. Show `lib/glm.ts`.**

> "The secret is here. Every time Amirah sends a message, we build a system prompt from her live Supabase data — income, bills, goals, spending history, limit flags. Everything. Then we call Z.AI's GLM. Remove the GLM and this is just a static page."

**Show `/api/chat/route.ts`.**

> "The API key never touches the browser. It's server-side only. Z.AI's GLM is the only intelligence layer — there's no rule engine, no hardcoded logic. It's all reasoning."

**Open Supabase dashboard. Show the goals table.**

> "That goal we just created? It's here. Real data. Written by the AI. Not by a form."

### Minute 8:00–9:00 — Impact

> "We ran three simulated user scenarios through BajetHidup. Users following GLM trade-off recommendations reduce discretionary overspend by 15–25%. Every major financial decision is modelled before it's made. That's what decision intelligence means."

### Minute 9:00–10:00 — Vision & Close

> "BajetHidup works today with manual entry. Post-hackathon, we integrate with BNM's MyFinancial open finance initiative and TNG eWallet API — and suddenly every young Malaysian's spending is automatically in the system, and the AI is reasoning on their behalf 24/7."

> "5 million PTPTN borrowers. 1.4 million gig workers. Young Malaysians making financial decisions every single day on gut feel. BajetHidup gives them a brain."

> *[Pause.]*

> "Runding, bukan sekadar rekod. Negotiate, not just record."

---

## Part 3 — Likely Judge Questions & Answers

**Q: Why not use a rule engine instead of GLM for the trade-off logic?**
A: "A rule engine can't handle the combinatorial complexity of multiple competing goals, variable spending history, and natural language inputs. The GLM reasons holistically — it sees the full picture and makes judgement calls that no rule could encode. Remove the GLM, and the app is a spreadsheet."

**Q: Is the data secure?**
A: "All GLM calls go through a server-side Next.js API route — the API key never touches the client. Supabase handles authentication. In production, we'd add user-level Row Level Security policies."

**Q: How does this work without bank integration?**
A: "Manual entry via natural language is the MVP. The AI parses free text like 'GrabFood lunch RM18' and logs it automatically. Post-hackathon, we'd integrate with BNM's MyFinancial initiative for automatic transaction sync."

**Q: What makes this different from other AI finance apps?**
A: "Two things. First — the AI takes action. It doesn't just advise, it creates goals, sets limits, and logs transactions. Second — it's built for Malaysia. Ringgit, GrabFood, Shopee, PTPTN, TNG. Not a Western app localised, but built from the ground up for the Malaysian context."

**Q: How do you ensure GLM doesn't give bad financial advice?**
A: "The system prompt explicitly instructs GLM never to recommend cutting recurring bills, never to exceed the user's income as a constraint, and to always present multiple options rather than a single directive. Users are always in control — every AI action requires a confirmation tap."

---

## Part 4 — Emergency Fallbacks

If the Z.AI API is slow or down during demo:
- Have a screen recording of the full negotiation flow ready
- Screenshot sequence of the Decision Card and Goal Preview Card
- Pre-load the AI page with the conversation already showing

If Supabase is slow:
- Demo data is static enough that you can show the UI without live updates
- Core AI conversation still works even if Realtime sync is slow

If the app crashes:
- Have Vercel preview URL as backup
- Have localhost:3000 running on laptop as ultimate backup
