'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_md: string;
};

type Target = {
  id: string;
  owner_name: string;
  first_name?: string;
  last_name?: string;
  company: string;
  property: string;
  city: string;
  email: string;
  status: 'new' | 'emailed' | 'replied' | 'called' | 'converted';
};

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  subject: z.string(),
  body_md: z.string(),
});

export default function TemplatesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const targetId = params.get('targetId') ?? '';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Template CRUD state
  const [showCRUD, setShowCRUD] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body_md: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // NEW: editable subject/body state for preview
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');

  // load templates
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

  // load target from URL parameters
  useEffect(() => {
    const targetName = params.get('targetName');
    const targetCompany = params.get('targetCompany');
    const targetProperty = params.get('targetProperty');
    const targetEmail = params.get('targetEmail');
    const targetCity = params.get('targetCity');
    
    if (targetId && targetName && targetEmail) {
      setTarget({
        id: targetId,
        owner_name: targetName,
        company: targetCompany || '',
        property: targetProperty || '',
        city: targetCity || '',
        email: targetEmail,
        status: 'new' as const, // We'll assume new for now
      });
    }
  }, [params, targetId]);

  useEffect(() => {
    const t = templates.find((x) => x.id === selectedId) || null;
    setSelected(t);
  }, [selectedId, templates]);

  // Substitution logic (what the template would look like before manual edits)
  const substituted = useMemo(() => {
    if (!selected || !target) return { subject: '', body: '' };

    // Derive first_name / last_name from owner_name
    const fullName = target.owner_name || '';
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ');

    const data = {
      owner_name: fullName,
      first_name: firstName,
      last_name: lastName,
      name: firstName || fullName, // legacy {{name}} support
      company: target.company || '',
      property: target.property || '',
      city: target.city || '',
      email: target.email || '',
    };

    let subject = selected.subject;
    let body = selected.body_md;

    // Replace Mustache-style placeholders {{key}}
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(placeholder, value);
      body = body.replace(placeholder, value);
    });

    return { subject, body };
  }, [selected, target]);

  // NEW: when template/target/substituted changes, reset editable fields
  useEffect(() => {
    if (selected && target) {
      setEditedSubject(substituted.subject);
      setEditedBody(substituted.body);
    } else {
      setEditedSubject('');
      setEditedBody('');
    }
  }, [substituted.subject, substituted.body, selected, target]);

  async function handleSend() {
    setError(null);
    if (!target || !selected) {
      setError('Pick a template and make sure a targetId is provided.');
      return;
    }
    // validate
    const parsed = TemplateSchema.safeParse(selected);
    if (!parsed.success) {
      setError('Template schema invalid.');
      return;
    }

    setSending(true);
    try {
      // Use our existing email-sends API
      // Pass editedSubject / editedBody so the backend can use the final text
      const sendRes = await fetch('/api/email-sends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          templateId: selected.id,
          subject: editedSubject,
          body: editedBody,
        }),
      });
      
      if (!sendRes.ok) {
        const j = await sendRes.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to send email.');
      }

      alert('Email sent successfully! Target status updated to "emailed".');
      router.push('/'); // back to targets
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  // Template CRUD Functions
  function handleNewTemplate() {
    setEditingTemplate(null);
    setFormData({ name: '', subject: '', body_md: '' });
    setFormError(null);
    setShowCRUD(true);
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
        // Update existing template
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
        // Create new template
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
      
      setShowCRUD(false);
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
        setSelected(null);
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Failed to delete template');
    }
  }

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Templates</h1>
        <button
          onClick={() => setShowCRUD(!showCRUD)}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showCRUD ? 'Hide Template Management' : 'Manage Templates'}
        </button>
      </div>

      {/* Template CRUD Section */}
      {showCRUD && (
        <div style={{ marginBottom: '24px' }}>
          {/* Template Form */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            backgroundColor: 'white', 
            padding: '16px',
            marginBottom: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </h2>
            
            {formError && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{formError}</p>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Intro Email"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Email Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Introduction from {{first_name}} about {{property}}"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                  Email Body (use {'{{first_name}}'}, {'{{last_name}}'}, {'{{owner_name}}'}, {'{{company}}'}, {'{{property}}'}, etc.)
                </label>
                <textarea
                  value={formData.body_md}
                  onChange={(e) => setFormData({ ...formData, body_md: e.target.value })}
                  placeholder="Hi {{first_name}}, ..."
                  rows={8}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#16a34a',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                
                {editingTemplate && (
                  <button
                    onClick={handleNewTemplate}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Existing Templates List */}
          <div style={{ 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            backgroundColor: 'white', 
            padding: '16px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>Existing Templates</h2>
            
            {templates.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>No templates yet. Create one above!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {templates.map((template) => (
                  <div
                    key={template.id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      padding: '12px',
                      backgroundColor: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, marginBottom: '4px' }}>
                          {template.name}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                          {template.subject}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          style={{
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '12px',
                      color: '#374151',
                      margin: 0,
                      fontFamily: 'monospace',
                      maxHeight: '100px',
                      overflow: 'auto'
                    }}>
                      {template.body_md}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left: controls */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          backgroundColor: 'white', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>Select Template</h2>
            <select
              style={{ 
                border: '1px solid #d1d5db', 
                borderRadius: '4px', 
                padding: '8px', 
                width: '100%',
                outline: 'none'
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
            backgroundColor: '#f9fafb' 
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
              fontSize: '14px'
            }}
          >
            {sending ? 'Sending…' : 'Send Email'}
          </button>

          {error && <p style={{ color: '#dc2626', fontSize: '14px' }}>{error}</p>}
        </div>

        {/* Right: preview + editing */}
        <div style={{ 
          border: '1px solid #e5e7eb', 
          borderRadius: '8px', 
          backgroundColor: 'white', 
          padding: '16px'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>Preview</h2>
          {!selected || !target ? (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Pick a template to preview.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Subject</div>
                <input
                  type="text"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Body</div>
                <textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  style={{ 
                    width: '100%',
                    whiteSpace: 'pre-wrap', 
                    fontSize: '14px',
                    padding: '12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                    margin: 0,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
