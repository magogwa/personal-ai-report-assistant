import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text, action, source } = body;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });

  const instructions: Record<string, string> = {
    improve: "Improve the grammar and flow of this text.",
    professional: "Make this text more professional.",
    expand: "Expand this text with more detail.",
    summarize: "Summarize this text concisely.",
    clarity: "Improve the clarity of this text.",
    formal: "Rewrite this using formal academic language.",
    consistency: "Check this text for consistency with the source information provided and flag any discrepancies.",
  };
  const prompt = `${instructions[action] || "Improve this text."}\n\nText:\n${text}\n\n${source ? "Source information:\n" + source : ""}\n\nReturn only the revised text.`;

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
  });
  const data = await res.json();
  return NextResponse.json({ result: data?.choices?.[0]?.message?.content || text });
}
