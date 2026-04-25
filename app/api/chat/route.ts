import { NextRequest, NextResponse } from "next/server";
import { buildFinancialContext, buildSystemPrompt, callIlmuAI, parseGlmResponse } from "@/lib/glm";
import { executeAction } from "@/lib/actions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId, messages } = await req.json();

    if (!userId || !messages) {
      return NextResponse.json({ error: "Missing userId or messages" }, { status: 400 });
    }

    const ctx = await buildFinancialContext(userId);
    const systemPrompt = buildSystemPrompt(ctx);

    const rawText = await callIlmuAI(messages, systemPrompt);
    const parsed = parseGlmResponse(rawText);

    let actionResult = null;
    if (parsed.action) {
      actionResult = await executeAction(userId, parsed.action);
    }

    return NextResponse.json({
      message: parsed.message,
      decision_card: parsed.decision_card ?? null,
      goal_preview: parsed.goal_preview ?? null,
      action: parsed.action ?? null,
      action_result: actionResult,
    });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
