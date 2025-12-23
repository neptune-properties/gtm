'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmailTemplate, Target, TemplateSchema, TEMPLATE_VARIABLES } from '@/app/templates/types';


export default function TemplatesPage() {
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
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  const copyVariable = async (placeholder: string) => {
    try {
      await navigator.clipboard.writeText(placeholder);
      setCopiedVariable(placeholder);
      setTimeout(() => setCopiedVariable(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const usedVariables = useMemo(() => {
    const text = `${formData.subject} ${formData.body_md}`;
    const matches = text.match(/\{\{[^}]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
  }, [formData.subject, formData.body_md]);

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

  useEffect(() => {
    const sel = templates.find((x) => x.id === selectedId) || null;
      if (sel) {
        setEditedSubject(sel.subject ?? '');
        setEditedBody(sel.body_md ?? '');
      } else {
        setEditedSubject('');
        setEditedBody('');
      }
    }, [selectedId, templates]);

  async function handleSendEmail() {
    setError(null);
    if (!target || !selected) {
      setError('Pick a template and make sure a targetId is provided.');
      return;
    }

    const parsed = TemplateSchema.safeParse(selected);
    if (!parsed.success) {
      setError('Template schema invalid.');
      return;
    }

    const subjectToSend = editedSubject ?? selected.subject;
    const bodyToSend = editedBody ?? selected.body_md;

    if (!subjectToSend.trim() || !bodyToSend.trim()) {
      setError('Subject and body cannot be empty.');
      return;
    }

    setSending(true);
    try {
      const sendRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: target.email,
          subject: subjectToSend,
          html: bodyToSend,
        }),
      });

      const sendJson = await sendRes.json().catch(() => ({}));

      if (!sendRes.ok || !sendJson.success) {
        throw new Error(sendJson.error || 'Email failed to send.');
      }

      const logRes = await fetch('/api/email-sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          templateId: selected.id,
          subject: subjectToSend,
          body: bodyToSend,
        }),
      });

      const logJson = await logRes.json().catch(() => ({}));

      if (!logRes.ok) {
        throw new Error(logJson.error || 'Failed to record email send.');
      }

      alert('Email sent!');
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Send failed');
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
    setFormData({
      name: template.name,
      subject: template.subject,
      body_md: template.body_md,
    });
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
        setTemplates(
          templates.map((t) =>
            t.id === editingTemplate.id ? json.template : t
          )
        );
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

      setTemplates(templates.filter((t) => t.id !== id));
      if (selectedId === id) {
        setSelectedId('');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to delete template');
    }
  }

  // Discard / revert changes in CRUD form
  function handleDiscard() {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        subject: editingTemplate.subject,
        body_md: editingTemplate.body_md,
      });
    } else {
      setFormData({ name: '', subject: '', body_md: '' });
    }
    setFormError(null);
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Send Email Mode */}
      {!showCRUD && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              Templates
            </h1>
            <button
              onClick={() => {
                handleNewTemplate(); // clears
                setShowCRUD(true);
              }}
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
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
            }}
          >
            {/* Left: controls */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    marginBottom: '8px',
                  }}
                >
                  Select Template
                </h2>
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

              <div
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                }}
              >
                <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>
                  Target Info
                </h3>
                {!target ? (
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    {targetId
                      ? 'Loading…'
                      : 'Open this page via "Send Email" from Targets.'}
                  </p>
                ) : (
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Name:</strong> {target.owner_name}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Email:</strong> {target.email}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Company:</strong> {target.company}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Property:</strong> {target.property}
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <strong>City:</strong> {target.city}
                    </div>
                    <div>
                      <strong>Status:</strong> {target.status}
                    </div>
                  </div>
                )}
              </div>

              <button
                disabled={!selected || !target || sending}
                onClick={handleSendEmail}
                style={{
                  backgroundColor:
                    !selected || !target || sending ? '#9ca3af' : '#16a34a',
                  color: 'white',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  border: 'none',
                  cursor:
                    !selected || !target || sending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                {sending ? 'Sending…' : 'Send Email'}
              </button>

              {error && (
                <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>
              )}
            </div>

            {/* Right: preview + editing */}
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '16px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  marginBottom: '12px',
                }}
              >
                Preview & Edit
              </h2>
              {!selected || !target ? (
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Pick a template to preview.
                </p>
              ) : (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Subject
                    </div>
                    <input
                      type="text"
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      style={{
                        width: '97%',
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: '#f9fafb',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        color: '#6b7280',
                        marginBottom: '4px',
                      }}
                    >
                      Body
                    </div>
                    <textarea
                      value={editedBody}
                      onChange={(e) => setEditedBody(e.target.value)}
                      rows={10}
                      style={{
                        width: '95.5%',
                        whiteSpace: 'pre-wrap',
                        fontSize: '14px',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        backgroundColor: '#f9fafb',
                        margin: 0,
                        fontFamily: 'inherit',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
          </>
      )}

      {showCRUD && (
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '24px',
              gap: '12px',
            }}
          >
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
              Back to Send
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 450px',
              gap: '16px',
            }}
          >
            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '24px 20px',
                height: 'fit-content',
              }}
            >
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#1f2937',
                }}
              >
                Variables
              </h2>
              <p
                style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginBottom: '12px',
                  marginTop: 0,
                }}
              >
                Click on a block to copy
              </p>

              <div
                style={{
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: copiedVariable ? '#374151' : 'white',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: copiedVariable ? 'white' : '#6b7280',
                  marginBottom: '16px',
                  transition: 'all 0.15s',
                }}
              >
                {copiedVariable ? 'Copied!' : 'Copy'}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    key={variable.name}
                    onClick={() => copyVariable(variable.placeholder)}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151',
                      transition: 'all 0.15s',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {variable.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: '#1f2937',
                  }}
                >
                  {editingTemplate ? 'EDIT TEMPLATE' : 'NEW TEMPLATE'}
                </h2>
                <button
                  onClick={handleDiscard}
                  aria-label="Revert changes"
                  title={
                    editingTemplate
                      ? 'Revert to saved template'
                      : 'Clear template'
                  }
                  style={{
                    backgroundColor: 'white',
                    color: '#6b7280',
                    padding: '8px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#dc2626',
                    fontSize: '13px',
                    marginBottom: '20px',
                  }}
                >
                  {formError}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                }}
              >
                {/* Template Name */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#9ca3af';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#9ca3af';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      marginBottom: '8px',
                      color: '#374151',
                    }}
                  >
                    Body
                  </label>
                  <textarea
                    value={formData.body_md}
                    onChange={(e) =>
                      setFormData({ ...formData, body_md: e.target.value })
                    }
                    rows={10}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      lineHeight: '1.6',
                      backgroundColor: '#f9fafb',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#9ca3af';
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = '#f9fafb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>

                {usedVariables.length > 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '-12px',
                    }}
                  >
                    {usedVariables.map((variable, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#6b7280',
                        }}
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                  }}
                >
                  <button
                    onClick={handleSaveTemplate}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: saving ? '#9ca3af' : '#2c5f5f',
                      color: 'white',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Template'}
                  </button>
                  <button
                    onClick={() =>
                      alert('Test email functionality coming soon!')
                    }
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: '#4ade80',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    Send Test to me
                  </button>
                </div>
              </div>
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                padding: '24px',
                height: 'fit-content',
              }}
            >
              <h2
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#1f2937',
                }}
              >
                Preview
              </h2>

              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: '#6b7280',
                    marginBottom: '10px',
                    letterSpacing: '0.5px',
                  }}
                >
                  SUBJECT
                </div>
                <div
                  style={{
                    padding: '14px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#1f2937',
                    minHeight: '20px',
                    lineHeight: '1.5',
                  }}
                >
                  {formData.subject}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: '#374151',
                    margin: 0,
                    fontFamily: 'inherit',
                    padding: '14px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    minHeight: '180px',
                  }}
                >
                  {formData.body_md}
                </pre>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
              }}
            >
              All Templates
            </h3>

            {templates.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                }}
              >
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  No templates yet. Create one above!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px',
                }}
              >
                {templates.map((template) => (
                  <div
                    key={template.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: '12px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          margin: 0,
                        }}
                      >
                        {template.name}
                      </h4>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          style={{
                            backgroundColor: '#2c5f5f',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginBottom: '12px',
                      }}
                    >
                      {template.subject}
                    </p>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: '12px',
                        color: '#374151',
                        margin: 0,
                        fontFamily: 'inherit',
                        maxHeight: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {template.body_md}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
