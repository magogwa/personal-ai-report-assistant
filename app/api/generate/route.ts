import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { data: report } = await supabase.from("reports").select("*").eq("id", body.reportId).single();
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  let template: any = null;
  if (report.template_id) {
    const { data } = await supabase.from("templates").select("*").eq("id", report.template_id).single();
    template = data;
  }
  const templateRef = template?.extracted_text ? `\n\nTemplate reference (follow this structure):\n${template.extracted_text.slice(0, 4000)}` : "";

  const { data: settingsRow } = await supabase.from("settings").select("*").eq("id", 1).single();
  const settings = settingsRow || {};
  const globalGuideline = settings.guideline ? `\n\nGlobal guideline (follow these rules):\n${settings.guideline.slice(0, 4000)}` : "";

  const { extractText } = await import("../../../lib/extract");
  let docsText = "";
  for (const d of (report.supporting_docs || [])) {
    try {
      const t = extractText(d.filePath, d.name);
      if (t) docsText += `\n--- ${d.name} ---\n${t.slice(0, 3000)}\n`;
    } catch {}
  }
  const docsRef = docsText ? `\n\nSupporting documents (use as reference, do not fabricate):\n${docsText}` : "";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });

  const prompt = `You are a professional report writer. Generate a ${report.report_type} following this structure priority: ${template ? template.name : "default structure for " + report.report_type}. 

Report details:
Title: ${report.title}
Project/Programme: ${report.project_name}
Reporting period: ${report.reporting_period}
Department/Location: ${report.department}
Responsible officer: ${report.responsible_officer}

Raw notes:
${report.raw_notes}

Additional instructions:
${report.ai_instructions}

Rules:
- Never fabricate data, statistics, activities, dates, or findings.
- Never assume an activity was completed unless source confirms it.
- Preserve meaning of original information.
- Do not invent references or citations.
- Flag missing information.
- Avoid unnecessary repetition.
- Use clear, professional language.
- Distinguish facts from interpretations and recommendations.

Produce a complete draft with headings and sections.${globalGuideline}${docsRef}

Additional formatting/output rules:
- Use font Times New Roman, size 12 for the final document.
- For Daily Report: do NOT include Project/Programme, Reporting Period, Department/Location, Responsible Officer, Introduction, or Conclusion sections. Only include the user's activities.
- For Weekly Report: do NOT include Project/Programme, Reporting Period, Department/Location, Responsible Officer fields or any "[Missing Information]" placeholders. Include an introductory paragraph. Only summarize the selected daily reports.
- For each activity provided by the user, write a concise summary of one to two lines only. Do not expand or add unrelated content.
- Do not fabricate data.
- Write the report in first person singular ("I").
- Do not use markdown symbols or special characters such as *, #, -, _, >, or backticks in the output. Use plain text only with clear headings and normal punctuation.${templateRef}`;

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.4 }),
  });
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || data?.error?.message || "Generation failed.";

  await supabase.from("reports").update({ content, status: "completed", updated_at: new Date().toISOString() }).eq("id", report.id);
  await supabase.from("generation_history").insert({ report_id: report.id, model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini" });

  return NextResponse.json({ content });
}
