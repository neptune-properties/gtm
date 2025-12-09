import { NextResponse } from "next/server"
import { createUserSupabaseClient, supabaseServer } from "@/lib/supabaseClient"


// Handles GET requests to /api/templates
export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  
  let supabase;
  if (token) {
    // If token provided, use authenticated client
    supabase = createUserSupabaseClient(token);
  } else {
    // If no token, use server client (bypasses RLS for reading templates)
    supabase = supabaseServer();
  }

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data });
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();

    const body = await req.json()
    const { name, subject, body_md } = body

    const { data, error } = await supabase
      .from("email_templates")
      .insert([{ name, subject, body_md }])
      .select("*")
      .single()

    if (error) {
      console.error("Supabase insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (err) {
    console.error("POST exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


export async function PUT(req: Request) {
  const supabase = supabaseServer()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const body = await req.json()
  const { name, subject, body_md } = body

  const { data, error } = await supabase
    .from("email_templates")
    .update({ name, subject, body_md })
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ template: data })
}

export async function DELETE(req: Request) {
  const supabase = supabaseServer()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  const { error } = await supabase.from("email_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}