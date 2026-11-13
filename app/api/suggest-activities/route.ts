import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "db.json");
function readDB() { try { if (!fs.existsSync(dataFile)) return { settings: {} }; return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return { settings: {} }; } }

export async function POST(req: NextRequest) {
  const db = readDB();
  const guideline = db.settings?.guideline || "";
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