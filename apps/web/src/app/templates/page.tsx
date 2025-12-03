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

  const substituted = useMemo(() => {
    if (!selected || !target) return { subject: '', body: '' };
    const data = {
      owner_name: target.owner_name || '',
      name: target.owner_name || '', // Alternative placeholder
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
  
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: target.email,
          subject: substituted.subject,
          html: substituted.body,
        }),
      });
  
      const data = await res.json();
  
      if (!data.success) {
        throw new Error(data.error || "Email failed to send.");
      }
  
      alert("Email sent successfully!");
  
      // OPTIONAL: update target status in your DB (emailed)
      await fetch("/api/email-sends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: target.id,
          templateId: selected.id,
        }),
      });
  
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Send failed");
    } finally {
      setSending(false);
    }
  }
  

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Templates</h1>

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
            onClick={handleSendEmail}
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

        {/* Right: preview */}
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
                <div style={{ fontWeight: '500', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
                  {substituted.subject}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>Body</div>
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '14px',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  backgroundColor: '#f9fafb',
                  margin: 0,
                  fontFamily: 'inherit'
                }}>
                  {substituted.body}
                </pre>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
