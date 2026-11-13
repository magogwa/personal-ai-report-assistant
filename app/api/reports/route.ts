import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const dataFile = path.join(process.cwd(), "data", "db.json");
const uploadDir = path.join(process.cwd(), "data", "uploads");

function readDB() {
  try {
    if (!fs.existsSync(dataFile)) return { reports: [], templates: [] };
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return { reports: [], templates: [] };
  }
}
function writeDB(db: any) {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.reports || []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDB();
  const report = {
    id: randomUUID(),
    title: body.title || "Untitled Report",
    reportType: body.reportType || "General Report",
    templateId: body.templateId || null,
    projectName: body.projectName || "",
    reportingPeriod: body.reportingPeriod || "",
    department: body.department || "",
    responsibleOfficer: body.responsibleOfficer || "",
    rawNotes: body.rawNotes || "",
    aiInstructions: body.aiInstructions || "",
    supportingDocs: body.supportingDocs || [],
    status: "draft",
    content: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.reports = db.reports || [];
  db.reports.push(report);
  writeDB(db);
  return NextResponse.json(report);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = readDB();
  const idx = (db.reports || []).findIndex((r: any) => r.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  db.reports[idx] = { ...db.reports[idx], ...body, updatedAt: new Date().toISOString() };
  writeDB(db);
  return NextResponse.json(db.reports[idx]);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const db = readDB();
  db.reports = (db.reports || []).filter((r: any) => r.id !== id);
  writeDB(db);
  return NextResponse.json({ ok: true });
}