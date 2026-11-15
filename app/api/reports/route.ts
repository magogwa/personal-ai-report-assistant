import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "../../../lib/supabase";

function mapReport(r: any) {
  if (!r) return r;
  return {
    id: r.id, title: r.title, reportType: r.report_type, projectName: r.project_name,
    reportingPeriod: r.reporting_period, department: r.department, responsibleOfficer: r.responsible_officer,
    rawNotes: r.raw_notes, aiInstructions: r.ai_instructions, templateId: r.template_id,
    supportingDocs: r.supporting_docs || [], content: r.content, status: r.status,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
export async function GET() {
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map(mapReport));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const report = {
    id: randomUUID(),
    title: body.title || "Untitled Report",
    report_type: body.reportType || "General Report",
    template_id: body.templateId || null,
    project_name: body.projectName || "",
    reporting_period: body.reportingPeriod || "",
    department: body.department || "",
    responsible_officer: body.responsibleOfficer || "",
    raw_notes: body.rawNotes || "",
    ai_instructions: body.aiInstructions || "",
    supporting_docs: body.supportingDocs || [],
    status: "draft",
    content: "",
  };
  const { data, error } = await supabase.from("reports").insert(report).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapReport(data));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("reports").update({ ...body, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapReport(data));
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
