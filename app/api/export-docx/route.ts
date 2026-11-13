import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { buildDocx } from "../../../lib/docx";

const dataFile = path.join(process.cwd(), "data", "db.json");
function readDB() { try { if (!fs.existsSync(dataFile)) return { reports: [] }; return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return { reports: [] }; } }

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const db = readDB();
  const report = (db.reports || []).find((r: any) => r.id === id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = buildDocx(report.title || "Report", report.content || "");
  return new NextResponse(buf as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${(report.title || "report").replace(/[^a-z0-9]/gi, "_")}.docx"` } });
}