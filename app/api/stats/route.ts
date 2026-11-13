import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "db.json");

function readDB() {
  try {
    if (!fs.existsSync(dataFile)) return { reports: [], templates: [] };
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return { reports: [], templates: [] };
  }
}

export async function GET() {
  const db = readDB();
  const reports = db.reports || [];
  return NextResponse.json({
    total: reports.length,
    drafts: reports.filter((r: any) => r.status === "draft").length,
    completed: reports.filter((r: any) => r.status === "completed").length,
    templates: (db.templates || []).length,
  });
}