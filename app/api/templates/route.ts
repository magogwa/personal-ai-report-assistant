import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabase } from "../../../lib/supabase";
import { extractText } from "../../../lib/extract";

export async function GET() {
  const { data, error } = await supabase.from("templates").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = (form.get("name") as string) || "Untitled";
  const category = (form.get("category") as string) || "General";
  const reportType = (form.get("reportType") as string) || "General Report";
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = ("." + file.name.split(".").pop()).toLowerCase();
  const allowed = [".docx", ".pdf", ".txt"];
  if (!allowed.includes(ext)) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

  const id = randomUUID();
  const buf = Buffer.from(await file.arrayBuffer());
  const storagePath = `${id}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("templates").upload(storagePath, buf, { contentType: file.type });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("templates").getPublicUrl(storagePath);
  const filePath = pub.publicUrl;
  const extracted = "";
  const tmpl = { id, name, category, report_type: reportType, file_name: file.name, file_path: filePath, storage_path: storagePath, extracted_text: extracted, created_at: new Date().toISOString() };
  const { data, error } = await supabase.from("templates").insert(tmpl).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  const { data: tmpl } = await supabase.from("templates").select("storage_path").eq("id", id).single();
  if (tmpl?.storage_path) await supabase.storage.from("templates").remove([tmpl.storage_path]);
  const { error } = await supabase.from("templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
