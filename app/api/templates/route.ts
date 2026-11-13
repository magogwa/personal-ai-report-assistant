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
  return NextResponse.json(db.templates || []);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || "Untitled";
  const category = (form.get("category") as string) || "General";
  const reportType = (form.get("reportType") as string) || "General Report";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const allowed = [".docx", ".pdf", ".txt"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowed.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  fs.mkdirSync(uploadDir, { recursive: true });
  const id = randomUUID();
  const buf = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, `${id}-${file.name}`);
  fs.writeFileSync(filePath, buf);

  const db = readDB();
  const { extractText } = await import("../../../lib/extract");
  const extracted = extractText(filePath, file.name);
  const tmpl = { id, name, category, reportType, fileName: file.name, filePath, extractedText: extracted, createdAt: new Date().toISOString() };
  db.templates = db.templates || [];
  db.templates.push(tmpl);
  writeDB(db);
  return NextResponse.json(tmpl);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const db = readDB();
  db.templates = (db.templates || []).filter((t: any) => t.id !== id);
  writeDB(db);
  return NextResponse.json({ ok: true });
}