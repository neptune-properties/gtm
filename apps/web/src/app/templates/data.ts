// apps/web/src/app/templates/data.ts
"use client";

import { supabaseBrowser } from "@/lib/supabaseClient";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_md: string;
  created_by?: string;
  created_at?: string;
};

const API_BASE = "/api/templates";

// helper to get current access token from supabase auth
async function getAccessToken() {
  const supabase = supabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function getTemplates(): Promise<EmailTemplate[]> {
  const token = await getAccessToken();

  const res = await fetch(API_BASE, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || "Failed to fetch templates");
  }

  // your route seems to return { templates: [...] }
  return json.templates || [];
}

export async function createTemplate(input: {
  name: string;
  subject: string;
  body_md: string;
}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || "Failed to create template");
  }
  return json;
}

export async function updateTemplate(
  id: string,
  input: Partial<Pick<EmailTemplate, "name" | "subject" | "body_md">>
) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}?id=${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || "Failed to update template");
  }
  return json;
}

export async function deleteTemplate(id: string) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_BASE}?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error || "Failed to delete template");
  }
  return json;
}