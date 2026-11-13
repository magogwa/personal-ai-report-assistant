import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "db.json");
function readDB() { try { if (!fs.existsSync(dataFile)) return { reports: [], templates: [] }; return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return { reports: [], templates: [] }; } }
function writeDB(db: any) { fs.mkdirSync(path.dirname(dataFile), { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(db, null, 2)); }

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDB();
  const report = (db.reports || []).find((r: any) => r.id === body.reportId);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const template = report.templateId ? (db.templates || []).find((t: any) => t.id === report.templateId) : null;
  const templateRef = template?.extractedText ? `\n\nTemplate reference (follow this structure):\n${template.extractedText.slice(0, 4000)}` : "";

  // Extract text from supporting documents
  const settings = db.settings || {};
  const globalGuideline = settings.guideline ? `\n\nGlobal guideline (follow these rules):\n${settings.guideline.slice(0, 4000)}` : "";

  const { extractText } = await import("../../../lib/extract");
  let docsText = "";
  for (const d of (report.supportingDocs || [])) {
    try {
      const t = extractText(d.filePath, d.name);
      if (t) docsText += `\n--- ${d.name} ---\n${t.slice(0, 3000)}\n`;
    } catch {}
  }
  const docsRef = docsText ? `\n\nSupporting documents (use as reference, do not fabricate):\n${docsText}` : "";

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENROUTER_API_KEY not set" }, { status: 500 });

  const prompt = `You are a professional report writer. Generate a ${report.reportType} following this structure priority: ${template ? template.name : "default structure for " + report.reportType}. 

Report details:
Title: ${report.title}
Project/Programme: ${report.projectName}
Reporting period: ${report.reportingPeriod}
Department/Location: ${report.department}
Responsible officer: ${report.responsibleOfficer}

Raw notes:
${report.rawNotes}

Additional instructions:
${report.aiInstructions}

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

  const idx = db.reports.findIndex((r: any) => r.id === report.id);
  db.reports[idx].content = content;
  db.reports[idx].status = "completed";
  db.reports[idx].updatedAt = new Date().toISOString();
  writeDB(db);

  // record history
  db.generationHistory = db.generationHistory || [];
  db.generationHistory.push({ reportId: report.id, createdAt: new Date().toISOString(), model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini" });
  writeDB(db);

  return NextResponse.json({ content });
}
