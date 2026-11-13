import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "db.json");

export async function GET() {
  if (!fs.existsSync(dataFile)) return NextResponse.json({ reports: [], templates: [] });
  const content = fs.readFileSync(dataFile, "utf8");
  return new NextResponse(content, { headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=db-backup.json" } });
}