import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
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
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { data, error } = await supabase.from("reports").update({ ...body, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
