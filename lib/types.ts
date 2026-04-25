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
