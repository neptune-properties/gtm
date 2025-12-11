'use client';

import { EmailTemplate } from './types';

interface TemplatesListProps {
  templates: EmailTemplate[];
  onEdit: (template: EmailTemplate) => void;
  onDelete: (id: string) => void;
}

export default function TemplatesList({ templates, onEdit, onDelete }: TemplatesListProps) {
  if (templates.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
      }}>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>No templates yet. Create one above!</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
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
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
              {template.name}
            </h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => onEdit(template)}
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
                onClick={() => onDelete(template.id)}
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
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
            {template.subject}
          </p>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontSize: '12px',
            color: '#374151',
            margin: 0,
            fontFamily: 'inherit',
            maxHeight: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {template.body_md}
          </pre>
        </div>
      ))}
    </div>
  );
}
