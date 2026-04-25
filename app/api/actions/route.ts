import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/actions";

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
    }
    const result = await executeAction(userId, action);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
