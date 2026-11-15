import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { buildDocx } from "../../../lib/docx";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const { data: report } = await supabase.from("reports").select("*").eq("id", id).single();
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = buildDocx(report.title || "Report", report.content || "");
  return new NextResponse(buf as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${(report.title || "report").replace(/[^a-z0-9]/gi, "_")}.docx"` } });
}
