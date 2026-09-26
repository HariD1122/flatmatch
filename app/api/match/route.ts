import { NextRequest, NextResponse } from "next/server";
import { fetchResponses } from "@/lib/data";
import { buildMatchResult } from "@/lib/match";
import { generateAiReasons } from "@/lib/gemini";
import { DEFAULT_SETTINGS, MatchSettings } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  let settings: MatchSettings = DEFAULT_SETTINGS;
  try {
    const body = await req.json();
    if (body?.settings) {
      settings = {
        requireLiftOrGround:
          typeof body.settings.requireLiftOrGround === "boolean"
            ? body.settings.requireLiftOrGround
            : DEFAULT_SETTINGS.requireLiftOrGround,
        maxDistHinjewadi:
          typeof body.settings.maxDistHinjewadi === "number"
            ? body.settings.maxDistHinjewadi
            : DEFAULT_SETTINGS.maxDistHinjewadi,
        maxDistGym:
          typeof body.settings.maxDistGym === "number"
            ? body.settings.maxDistGym
            : DEFAULT_SETTINGS.maxDistGym,
      };
    }
  } catch {
    // no body / invalid JSON -> use defaults
  }

  const { source, note, rows } = await fetchResponses();
  const result = buildMatchResult(rows, source, note, settings);

  if (result.top.length > 0) {
    const aiReasons = await generateAiReasons(result.top);
    if (aiReasons) {
      result.top = result.top.map((t) => ({
        ...t,
        reason: aiReasons[t.address] || t.reason,
      }));
    }
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
