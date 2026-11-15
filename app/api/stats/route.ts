import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export async function GET() {
  const { data: reports } = await supabase.from("reports").select("status");
  const { count: templateCount } = await supabase.from("templates").select("*", { count: "exact", head: true });
  const r = reports || [];
  return NextResponse.json({
    total: r.length,
    drafts: r.filter((x: any) => x.status === "draft").length,
    completed: r.filter((x: any) => x.status === "completed").length,
    templates: templateCount || 0,
  });
}
