'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmailTemplate, Target } from './types';
import TemplateForm from './TemplateForm';
import TemplatePreview from './TemplatePreview';
import TemplatesList from './TemplatesList';

export default function TemplatesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const targetId = params.get('targetId') ?? '';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [target, setTarget] = useState<Target | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCRUD, setShowCRUD] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body_md: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = templates.find((x) => x.id === selectedId) || null;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/templates', { cache: 'no-store' });
        const json = await res.json();
        setTemplates(json.templates || []);
      } catch (e) {
        console.error(e);
        setTemplates([]);
      }
    })();
  }, []);

  useEffect(() => {
    const targetName = params.get('targetName');
    const targetEmail = params.get('targetEmail');

    if (targetId && targetName && targetEmail) {
      setTarget({
        id: targetId,
        owner_name: targetName,
        company: params.get('targetCompany') || '',
        property: params.get('targetProperty') || '',
        city: params.get('targetCity') || '',
        email: targetEmail,
        status: 'new' as const,
      });
    }
  }, [params, targetId]);

  async function handleSend() {
    setError(null);
    if (!target || !selected) {
      setError('Pick a template and make sure a targetId is provided.');
      return;
    }

    setSending(true);
    try {
      const sendRes = await fetch('/api/email-sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          templateId: selected.id,
        }),
      });

      if (!sendRes.ok) {
        const j = await sendRes.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to send email.');
      }

      alert('Email sent successfully');
      router.push('/');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  function handleNewTemplate() {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body_md: '' });
    setFormError(null);
  }

  function handleEditTemplate(template: EmailTemplate) {
    setEditingTemplate(template);
    setFormData({ name: template.name, subject: template.subject, body_md: template.body_md });
    setFormError(null);
    setShowCRUD(true);
  }

  async function handleSaveTemplate() {
    setFormError(null);

    if (!formData.name || !formData.subject || !formData.body_md) {
      setFormError('All fields are required');
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate) {
        const res = await fetch(`/api/templates?id=${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to update template');
        }

        const json = await res.json();
        setTemplates(templates.map(t => t.id === editingTemplate.id ? json.template : t));
      } else {
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error || 'Failed to create template');
        }

        const json = await res.json();
        setTemplates([json.template, ...templates]);
      }

      setFormData({ name: '', subject: '', body_md: '' });
      setEditingTemplate(null);
    } catch (e: any) {
      console.error(e);
      setFormError(e.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/templates?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to delete template');
      }

      setTemplates(templates.filter(t => t.id !== id));
      if (selectedId === id) {
        setSelectedId('');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to delete template');
    }
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {!showCRUD && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Templates</h1>
            <button
              onClick={() => setShowCRUD(true)}
              style={{
                backgroundColor: '#4ade80',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              + New
            </button>
          </div>

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'white',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Select Template</h2>
                <select
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    padding: '8px',
                    width: '100%',
                    outline: 'none',
                  }}
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">— Choose a template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '12px',
                backgroundColor: '#f9fafb',
              }}>
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>Target Info</h3>
                {!target ? (
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    {targetId ? 'Loading…' : 'Open this page via "Send Email" from Targets.'}
                  </p>
                ) : (
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}><strong>Name:</strong> {target.owner_name}</div>
                    <div style={{ marginBottom: '4px' }}><strong>Email:</strong> {target.email}</div>
                    <div style={{ marginBottom: '4px' }}><strong>Company:</strong> {target.company}</div>
                    <div style={{ marginBottom: '4px' }}><strong>Property:</strong> {target.property}</div>
                    <div style={{ marginBottom: '4px' }}><strong>City:</strong> {target.city}</div>
                    <div><strong>Status:</strong> {target.status}</div>
                  </div>
                )}
              </div>

              <button
                disabled={!selected || !target || sending}
                onClick={handleSend}
                style={{
                  backgroundColor: !selected || !target || sending ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  border: 'none',
                  cursor: !selected || !target || sending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {sending ? 'Sending…' : 'Send Email'}
              </button>

              {error && <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>}
            </div>

            <TemplatePreview selected={selected} target={target} />
          </section>
        </>
      )}

      {showCRUD && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
            <button
              onClick={() => {
                setShowCRUD(false);
                setEditingTemplate(null);
                setFormData({ name: '', subject: '', body_md: '' });
              }}
              style={{
                backgroundColor: '#2c5f5f',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Send Message
            </button>
            {editingTemplate && (
              <button
                onClick={handleNewTemplate}
                style={{
                  backgroundColor: '#4ade80',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                + New
              </button>
            )}
          </div>

          <TemplateForm
            editingTemplate={editingTemplate}
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveTemplate}
            saving={saving}
            error={formError}
          />

          <div style={{ marginTop: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>All Templates</h3>
            <TemplatesList
              templates={templates}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
            />
          </div>
        </div>
      )}
    </main>
  );
}
