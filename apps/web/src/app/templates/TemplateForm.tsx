'use client';

import { useState, useMemo } from 'react';
import { EmailTemplate, TEMPLATE_VARIABLES } from './types';

interface TemplateFormProps {
  editingTemplate: EmailTemplate | null;
  formData: { name: string; subject: string; body_md: string };
  setFormData: (data: { name: string; subject: string; body_md: string }) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  error: string | null;
}

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#f9fafb',
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.backgroundColor = 'white';
  e.target.style.borderColor = '#9ca3af';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.target.style.backgroundColor = '#f9fafb';
  e.target.style.borderColor = '#d1d5db';
};

export default function TemplateForm({
  editingTemplate,
  formData,
  setFormData,
  onSave,
  saving,
  error,
}: TemplateFormProps) {
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 450px', gap: '16px' }}>
      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        padding: '24px 20px',
        height: 'fit-content',
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#1f2937',
        }}>
          Variables
        </h2>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '12px', marginTop: 0 }}>
          Click to copy
        </p>

        <div style={{
          padding: '10px 14px',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          backgroundColor: copiedVariable ? '#374151' : 'white',
          textAlign: 'center',
          fontSize: '12px',
          fontWeight: '500',
          color: copiedVariable ? 'white' : '#6b7280',
          marginBottom: '16px',
        }}>
          {copiedVariable ? 'Copied!' : 'Copy'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        padding: '24px',
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#1f2937',
        }}>
          {editingTemplate ? 'EDIT TEMPLATE' : 'NEW TEMPLATE'}
        </h2>

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#dc2626',
            fontSize: '13px',
            marginBottom: '20px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151',
            }}>
              Template Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyles}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151',
            }}>
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={inputStyles}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#374151',
            }}>
              Body
            </label>
            <textarea
              value={formData.body_md}
              onChange={(e) => setFormData({ ...formData, body_md: e.target.value })}
              rows={10}
              style={{
                ...inputStyles,
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6',
              } as React.CSSProperties}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {usedVariables.length > 0 && (
            <div style={{
              fontSize: '11px',
              color: '#6b7280',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '-12px',
            }}>
              {usedVariables.map((variable, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    color: '#6b7280',
                  }}
                >
                  {variable}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={onSave}
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
              onClick={() => alert('Test email functionality coming soon!')}
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

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        backgroundColor: 'white',
        padding: '24px',
        height: 'fit-content',
      }}>
        <h2 style={{
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '20px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: '#1f2937',
        }}>
          Preview
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#6b7280',
            marginBottom: '10px',
            letterSpacing: '0.5px',
          }}>
            SUBJECT
          </div>
          <div style={{
            padding: '14px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#1f2937',
            minHeight: '20px',
            lineHeight: '1.5',
          }}>
            {formData.subject}
          </div>
        </div>

        <div>
          <pre style={{
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
          }}>
            {formData.body_md}
          </pre>
        </div>
      </div>
    </div>
  );
}
