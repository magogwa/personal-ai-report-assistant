import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  const { data: settingsRow } = await supabase.from("settings").select("guideline").eq("id", 1).single();
  const guideline = settingsRow?.guideline || "";
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });
  const prompt = `Based on the following guideline, suggest a concise list of activities conducted for a daily report. Return only up to 5 activities, one per line, no numbering or symbols.\n\nGuideline:\n${guideline}`;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
  });
  const data = await res.json();
  return NextResponse.json({ result: data?.choices?.[0]?.message?.content || "" });
}
