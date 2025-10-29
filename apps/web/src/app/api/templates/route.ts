import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

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
    const body = await req.json()
    const { name, subject, body_md } = body

    if (!name || !subject || !body_md) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("email_templates")
      .insert([{ name, subject, body_md }])
      .select("*")
      .single()

    if (error) {
      console.error("POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (err) {
    console.error("POST exception:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const body = await req.json()
    const { name, subject, body_md } = body

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("email_templates")
      .update({ name, subject, body_md })
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("PUT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ template: data })
  } catch (err) {
    console.error("PUT exception:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const { error } = await supabase
      .from("email_templates")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE exception:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
