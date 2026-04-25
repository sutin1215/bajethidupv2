## 🎥 Pitching & Product Demonstration
link : https://drive.google.com/file/d/1Vv00bZWengJXK4Q7Jzq5zfvvIKGnzXiz/view?usp=sharing

# 💸 Bajet Hidup: Runding, Bukan Sekadar Rekod

**UMHackathon 2026 Submission** **Domain 2:** AI for Economic Empowerment & Decision Intelligence  
**Team:** Muhammad Faizal Haris bin Aidi ,Muhammad Noor Danish Bin Nordin & Nadhiratul Insyirah Binti Esmadi

---

## 📁 Required Deliverables
All official documentation and presentation materials are included in this repository in PDF format as per the preliminary round guidelines.

| Deliverable | File Link | Description |
| :--- | :--- | :--- |
| **Product Requirement Document** | [📄 PRD.pdf](./PRD.pdf) | Market fit, user stories, and product scope. |
| **System Analysis Document** | [📄 SAD.pdf](./SAD.pdf) | Cloud-native architecture, GLM integration, and data flows. |
| **Quality Assurance Testing** | [📄 QATD.pdf](./QATD.pdf) | Test cases, adversarial AI prompt handling, and mitigations. |
| **Pitching Deck** | [📄 Pitch_Deck.pdf](./Pitch_Deck.pdf) | Slide deck used in the pitching video. |

---

## 🚀 Project Overview

**Bajet Hidup** removes the friction of manual financial tracking by functioning as an AI-powered decision intelligence agent for young Malaysians. Instead of a passive ledger that simply records where money went, Bajet Hidup leverages **Z.AI's GLM** to actively negotiate where money *should* go. 

By analyzing unstructured inputs, detecting spending patterns, and running real-time trade-off simulations against active savings goals, the system executes real database mutations to optimize the user's economic outcomes.

### ✨ Core Features
* **The AI Negotiator:** A conversational interface where the GLM parses natural language (English/Bahasa Malaysia) to log transactions automatically (e.g., "GrabFood nasi lemak RM12").
* **Intelligent Action Execution:** The GLM outputs structured JSON `<ACTION>` tags to autonomously execute database transactions (`CREATE_GOAL`, `SET_CATEGORY_LIMIT`).
* **Trade-Off Analysis:** Generates `<DECISION_CARD>` UI elements that simulate the impact of discretionary purchases against existing goals, offering actionable mitigation strategies.
* **Financial Intelligence Dashboard:** Auto-generates weekly summaries, calculates savings velocity, and flags behavioral spending anomalies (e.g., "Shopee Splurger", "Weekend Spender").

---

## 🛠️ Technical Architecture

Bajet Hidup is built on a modern, serverless Cloud-Native stack:

* **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Tremor (Data Vis).
* **Backend BaaS:** Supabase (PostgreSQL, Row Level Security, Realtime WebSocket sync).
* **AI Intelligence:** Z.AI GLM (integrated via secure server-side API routes to manage system prompts and prevent prompt-injection).

---

## 📂 Project Directory Structure

```text
bajet-hidup/
├── .next/                  # Next.js build output
├── app/                    # Next.js App Router (Pages & API routes)
├── bajet-hidup-blueprint/  # System blueprints & development guides
├── components/             # React UI components (shadcn/ui & Tremor)
├── hooks/                  # Custom React hooks (e.g., usePersona)
├── lib/                    # Core logic (GLM engine, Supabase clients, types)
├── scripts/                # Database seeding scripts
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Git ignore rules
├── components.json         # shadcn/ui configuration
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.mjs         # Next.js configuration
├── package-lock.json       # Dependency lockfile
├── package.json            # Project dependencies
├── postcss.config.mjs      # PostCSS configuration
├── README.md               # Project documentation
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

💻 Local Development Setup
To run this project locally, follow these steps:

1. Clone the repository
Bash
git clone [https://github.com/YOUR_GITHUB_USERNAME/bajet-hidup.git](https://github.com/YOUR_GITHUB_USERNAME/bajet-hidup.git)
cd bajet-hidup
2. Install dependencies
Bash
npm install
3. Environment Variables
Create a .env.local file in the root directory and add your keys:

Code snippet
ZAI_API_KEY=your_zai_api_key_here
ZAI_BASE_URL=[https://api.z.ai/v1](https://api.z.ai/v1)
ZAI_MODEL=glm-4

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
4. Database Setup
Create a new Supabase project.

Run the SQL schema provided in bajet-hidup-blueprint/02_database.md in the Supabase SQL Editor.

Run the seed data script to populate the demo users (Amirah and Martin).

5. Run the development server
Bash
npm run dev
Navigate to http://localhost:3000 to view the application.

Built for UMHackathon 2026
