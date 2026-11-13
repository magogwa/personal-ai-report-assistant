import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "db.json");
function readDB() { try { if (!fs.existsSync(dataFile)) return { reports: [], templates: [], settings: {} }; return JSON.parse(fs.readFileSync(dataFile, "utf8")); } catch { return { reports: [], templates: [], settings: {} }; } }
function writeDB(db: any) { fs.mkdirSync(path.dirname(dataFile), { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(db, null, 2)); }

export async function GET() {
  const db = readDB();
  return NextResponse.json(db.settings || {});
}
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = readDB();
  db.settings = { ...(db.settings || {}), ...body };
  writeDB(db);
  return NextResponse.json(db.settings);
}