import { MatchResult } from "./types";

function model(): string {
  return process.env.GEMINI_MODEL || "gemini-3.8-flash";
}

async function callGemini(prompt: string, jsonSchema?: object): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent?key=${apiKey}`;
    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
    };
    if (jsonSchema) {
      body.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      };
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

export async function generateAiReasons(
  top: MatchResult["top"]
): Promise<Record<string, string> | null> {
  if (top.length === 0) return null;

  const facts = top.map((t) => ({
    address: t.address,
    foundBy: t.foundBy,
    score: t.score,
    rent: t.inputs.rent,
    distHinjewadi: t.inputs.distHinjewadi,
    distGym: t.inputs.distGym,
    distFamily: t.inputs.distFamily,
    parking: t.inputs.parking,
    petFriendly: t.inputs.petFriendly,
    bathrooms: t.inputs.bathrooms,
  }));

  const prompt = `Three friends (Kavita, Riya, Meera) are choosing a shared flat in Pune. Here are the top 3 candidate flats with their facts as JSON:
${JSON.stringify(facts, null, 2)}

For EACH flat, write ONE friendly, specific sentence (28 words max) explaining why it's a good match, mentioning at least one concrete number (distance or rent). Return a JSON object mapping each address exactly (as given) to its sentence.`;

  const schema = {
    type: "object",
    properties: Object.fromEntries(top.map((t) => [t.address, { type: "string" }])),
  };

  const text = await callGemini(prompt, schema);
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    return null;
  }
  return null;
}

export async function answerChatQuestion(
  question: string,
  results: MatchResult
): Promise<string | null> {
  const prompt = `You are a helpful assistant discussing flat-hunting results for three friends (Kavita, Riya, Meera) sharing a flat in Pune. Answer ONLY using the JSON results below — do not invent facts. Keep the answer to 2-4 friendly sentences. The final decision is theirs, not yours.

Results JSON:
${JSON.stringify(results, null, 2)}

Question: ${question}`;

  return callGemini(prompt);
}
