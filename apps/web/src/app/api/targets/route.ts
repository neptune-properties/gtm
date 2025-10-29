import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const { searchParams } = new URL(req.url);

  const city = searchParams.get("city");
  const status = searchParams.get("status");
  const mode = searchParams.get("mode");

  if (mode === "distinct") {
    const [citiesRes, statusesRes] = await Promise.all([
      supabase.from("targets").select("city").not("city", "is", null),
      supabase.from("targets").select("status").not("status", "is", null),
    ]);

    const uniqueCities = [
      ...new Set((citiesRes.data || []).map((r) => r.city)),
    ].filter(Boolean);
    const uniqueStatuses = [
      ...new Set((statusesRes.data || []).map((r) => r.status)),
    ].filter(Boolean);

    return NextResponse.json({
      cities: uniqueCities,
      statuses: uniqueStatuses,
    });
  }

  let query = supabase.from("targets").select("*");
  if (city) query = query.eq("city", city);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ targets: data });
}