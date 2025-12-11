'use client';

import { useMemo } from 'react';
import { EmailTemplate, Target } from './types';

interface TemplatePreviewProps {
  selected: EmailTemplate | null;
  target: Target | null;
}

export default function TemplatePreview({ selected, target }: TemplatePreviewProps) {
  const substituted = useMemo(() => {
    if (!selected || !target) return { subject: '', body: '' };
    
    const data = {
      owner_name: target.owner_name || '',
      name: target.owner_name || '',
      company: target.company || '',
      property: target.property || '',
      city: target.city || '',
      email: target.email || '',
    };

    let subject = selected.subject;
    let body = selected.body_md;

    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(placeholder, value);
      body = body.replace(placeholder, value);
    });

    return { subject, body };
  }, [selected, target]);

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: 'white',
      padding: '16px',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>Preview</h2>
      {!selected || !target ? (
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Pick a template to preview.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
              Subject
            </div>
            <div style={{
              fontWeight: '500',
              padding: '8px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
            }}>
              {substituted.subject}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', marginBottom: '4px' }}>
              Body
            </div>
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: '#f9fafb',
              margin: 0,
              fontFamily: 'inherit',
            }}>
              {substituted.body}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
