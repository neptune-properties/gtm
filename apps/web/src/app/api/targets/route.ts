import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

// GET: list targets (newest first)
export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("targets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ targets: data });
}

// POST: insert a single target (service role, avoids RLS/caching headaches)
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Minimal shape sanitizer
    const row = {
      owner_name: payload.owner_name ?? "",
      company: payload.company ?? "",
      city: payload.city ?? "",
      email: payload.email ?? "",
      property: payload.property ?? "",
      source: payload.source ?? "apollo",
      status: payload.status ?? "new",
    };

    const supabase = supabaseServer();
    // Prevent dup by email (server-side guard)
    const { data: existing, error: checkErr } = await supabase
      .from("targets")
      .select("id,email")
      .eq("email", row.email)
      .maybeSingle();

    if (checkErr) {
      console.error(checkErr);
      return NextResponse.json({ error: checkErr.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ duplicated: true, target: existing }, { status: 200 });
    }

    const { data, error } = await supabase.from("targets").insert(row).select("*").single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ target: data });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || "Insert failed" }, { status: 500 });
  }
}
