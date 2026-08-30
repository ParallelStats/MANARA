import { parseConversationTurnRequest } from "@/application/conversation/conversation-safety";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const input = parseConversationTurnRequest(body);
  if (!input) return Response.json({ ok: false }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    return Response.json({
      ok: false,
      availability: "UNAVAILABLE",
      failure: "unconfigured",
    }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { createGeminiConversationProvider } = await import(
    "@/ai/providers/gemini/gemini-conversation-provider"
  );
  const provider = createGeminiConversationProvider({ apiKey });
  const result = await provider.generate(input, request.signal);
  return Response.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
