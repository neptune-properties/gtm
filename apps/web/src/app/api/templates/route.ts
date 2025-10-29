import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"
import { createClient } from "@supabase/supabase-js"

function createUserSupabaseClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

// Handles GET requests to /api/templates
export async function GET() {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Supabase error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates: data || [] })
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 })
    }

    // ✅ Create a Supabase client scoped to the user’s session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

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
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token)
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 })

  const supabase = createUserSupabaseClient(token)
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

// -----------------------------------------------
// DELETE (remove template)
export async function DELETE(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token)
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 })

  const supabase = createUserSupabaseClient(token)
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  const { error } = await supabase.from("email_templates").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}