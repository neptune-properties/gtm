import { supabase } from "@/lib/supabaseClient"

export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body_md: string
  created_by?: string
  created_at?: string
}

// READ all templates
export async function getTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("getTemplates error:", error)
    return []
  }

  return data || []
}

// CREATE new template
export async function createTemplate(input: {
  name: string
  subject: string
  body_md: string
  created_by?: string
}) {
  const { data, error } = await supabase
    .from("email_templates")
    .insert([input])
    .select("*")
    .single()

  if (error) throw error
  return data as EmailTemplate
}

// UPDATE template
export async function updateTemplate(
  id: string,
  input: { name: string; subject: string; body_md: string }
) {
  const { data, error } = await supabase
    .from("email_templates")
    .update(input)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw error
  return data as EmailTemplate
}

// DELETE template
export async function deleteTemplate(id: string) {
  const { error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", id)
  if (error) throw error
}
