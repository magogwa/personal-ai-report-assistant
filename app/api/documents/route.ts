import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const uploadDir = path.join(process.cwd(), "data", "uploads");

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const allowed = [".docx", ".pdf", ".xlsx", ".csv", ".txt"];
  const ext = path.extname(file.name).toLowerCase();
  if (!allowed.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  fs.mkdirSync(uploadDir, { recursive: true });
  const id = randomUUID();
  const buf = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(uploadDir, `${id}-${file.name}`);
  fs.writeFileSync(filePath, buf);
  return NextResponse.json({ id, name: file.name, filePath, size: file.size });
}