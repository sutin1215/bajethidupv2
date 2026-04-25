import { supabaseAdmin } from "./supabase-server";
import { GlmAction } from "./types";

// Central dispatcher — GLM sends an action, this executes it
export async function executeAction(
  userId: string,
  action: GlmAction
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    switch (action.type) {
      case "CREATE_GOAL":
        return await createGoal(userId, action.payload);
      case "UPDATE_GOAL":
        return await updateGoal(userId, action.payload);
      case "SET_CATEGORY_LIMIT":
        return await setCategoryLimit(userId, action.payload);
      case "LOG_TRANSACTION":
        return await logTransaction(userId, action.payload);
      case "UPDATE_GOAL_STATUS":
        return await updateGoalStatus(userId, action.payload);
      default:
        return { success: false, error: "Unknown action type" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function createGoal(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .insert({
      user_id: userId,
      name: payload.name,
      target_amount: payload.target_amount,
      monthly_contribution: payload.monthly_contribution,
      deadline: payload.deadline,
      saved_amount: 0,
      status: "on_track",
      tips: payload.tips,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function updateGoal(userId: string, payload: any) {
  const updates: any = {};
  if (payload.monthly_contribution !== undefined)
    updates.monthly_contribution = payload.monthly_contribution;
  if (payload.deadline !== undefined)
    updates.deadline = payload.deadline;
  if (payload.saved_amount !== undefined)
    updates.saved_amount = payload.saved_amount;

  const { data, error } = await supabaseAdmin
    .from("goals")
    .update(updates)
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function setCategoryLimit(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("category_limits")
    .upsert(
      {
        user_id: userId,
        category: payload.category,
        monthly_limit: payload.monthly_limit,
        set_by_ai: true,
        set_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category" }
    )
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function logTransaction(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("transactions")
    .insert({
      user_id: userId,
      amount: payload.amount,
      category: payload.category,
      merchant: payload.merchant,
      description: payload.description,
      date: payload.date,
      raw_input: payload.raw_input,
      added_by_ai: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

async function updateGoalStatus(userId: string, payload: any) {
  const { data, error } = await supabaseAdmin
    .from("goals")
    .update({ status: payload.status })
    .eq("id", payload.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
