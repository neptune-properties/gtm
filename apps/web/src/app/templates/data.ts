// apps/web/src/app/templates/data.ts
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body_md: string
  created_by?: string
  created_at?: string
}
import { supabase } from "@/lib/supabaseClient"

const API_BASE = "/api/templates"

export async function getTemplates(): Promise<EmailTemplate[]> {
  const res = await fetch(API_BASE)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.templates || []
}


export async function createTemplate(input) {
  // Get the current session token from Supabase Auth
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch("/api/templates", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ✅ Send the user’s access token to the API
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(input),
  })

  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.template
}


export async function updateTemplate(id, input) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`/api/templates?id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(input),
  })

  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.template
}


export async function deleteTemplate(id) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`/api/templates?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${session?.access_token}`,
    },
  })

  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

