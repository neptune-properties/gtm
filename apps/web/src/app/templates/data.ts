// apps/web/src/app/templates/data.ts
export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body_md: string
  created_by?: string
  created_at?: string
}

const API_BASE = "/api/templates"

export async function getTemplates(): Promise<EmailTemplate[]> {
  const res = await fetch(API_BASE)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.templates || []
}

export async function createTemplate(input: {
  name: string
  subject: string
  body_md: string
}) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.template
}

export async function updateTemplate(
  id: string,
  input: { name: string; subject: string; body_md: string }
) {
  const res = await fetch(`${API_BASE}?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.template
}

export async function deleteTemplate(id: string) {
  const res = await fetch(`${API_BASE}?id=${id}`, { method: "DELETE" })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
}
