// apps/web/src/app/templates/page.tsx
"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  type EmailTemplate,
} from "./data";

// requirements for templates
const TemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body_md: z.string().min(20, "Body must be at least 20 characters long"),
});

type FormState = {
  id?: string;
  name: string;
  subject: string;
  body_md: string;
  error?: string;
  saving: boolean;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>({
    name: "",
    subject: "",
    body_md: "",
    saving: false,
  });

  // Fetches templates on root render
  useEffect(() => {
    (async () => {
      try {
        const t = await getTemplates();
        setTemplates(t);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleNew() {
    setForm({ name: "", subject: "", body_md: "", saving: false });
  }

  function handleEdit(t: EmailTemplate) {
    setForm({
      id: t.id,
      name: t.name,
      subject: t.subject,
      body_md: t.body_md,
      saving: false,
    });
  }

  async function handleDelete(id: string) {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      if (form.id === id) handleNew();
    } catch (err) {
      console.error(err);
      setForm((f) => ({ ...f, error: "Failed to delete template." }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = TemplateSchema.safeParse(form);
    if (!parsed.success) {
      setForm((f) => ({ ...f, error: parsed.error.errors[0].message }));
      return;
    }

    setForm((f) => ({ ...f, saving: true, error: undefined }));
    try {
      if (form.id) {
        // update existing
        const updated = await updateTemplate(form.id, {
          name: form.name,
          subject: form.subject,
          body_md: form.body_md,
        });
        // depending on your route response, you may need updated.data
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
      } else {
        // create new
        const created = await createTemplate({
          name: form.name,
          subject: form.subject,
          body_md: form.body_md,
        });
        setTemplates((prev) => [created, ...prev]);
      }
      handleNew();
    } catch (err) {
      console.error(err);
      setForm((f) => ({ ...f, error: "Failed to save template." }));
    } finally {
      setForm((f) => ({ ...f, saving: false }));
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Email Templates</h1>

      {/* FORM */}
      <section className="border p-4 rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-medium">
          {form.id ? "Edit Template" : "New Template"}
        </h2>

        {form.error && <p className="text-red-500">{form.error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-3">
          <input
            type="text"
            name="name"
            placeholder="Template Name"
            value={form.name}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
          <input
            type="text"
            name="subject"
            placeholder="Email Subject"
            value={form.subject}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
          <textarea
            name="body_md"
            placeholder="Email Body (Markdown)"
            value={form.body_md}
            onChange={handleChange}
            className="border rounded px-2 py-1 h-32 font-mono"
          />
          <button
            type="submit"
            disabled={form.saving}
            className="bg-blue-600 text-white rounded px-3 py-2"
          >
            {form.saving
              ? "Saving..."
              : form.id
              ? "Update Template"
              : "Create Template"}
          </button>
        </form>
      </section>

      {/* LIST */}
      <section>
        <h2 className="text-lg font-medium mb-2">Existing Templates</h2>
        {loading ? (
          <p>Loading...</p>
        ) : templates.length === 0 ? (
          <p>No templates yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {templates.map((t) => (
              <li
                key={t.id}
                className="border rounded-lg bg-white p-4 flex flex-col gap-2 shadow-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <strong>{t.name}</strong>
                    <div className="text-sm text-gray-600">{t.subject}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="text-xs bg-gray-200 px-2 py-1 rounded"
                      onClick={() => handleEdit(t)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {t.body_md}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
