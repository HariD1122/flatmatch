import { NextRequest, NextResponse } from "next/server";
import { answerChatQuestion } from "@/lib/gemini";
import { MatchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = body?.question;
    const results: MatchResult = body?.results;

    if (!question || !results) {
      return NextResponse.json({ error: "Missing question or results" }, { status: 400 });
    }

    const answer = await answerChatQuestion(question, results);
    if (!answer) {
      return NextResponse.json({
        answer:
          "I can't reach the AI assistant right now, but you can compare the score, rent, and distances shown on each card directly.",
      });
    }

    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
