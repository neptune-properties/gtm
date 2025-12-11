export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body_md: string;
};

export type Target = {
  id: string;
  owner_name: string;
  company: string;
  property: string;
  city: string;
  email: string;
  status: 'new' | 'emailed' | 'replied' | 'called' | 'converted';
};

export const TEMPLATE_VARIABLES = [
  { name: 'company', label: 'Company', placeholder: '{{company}}' },
  { name: 'property', label: 'Property', placeholder: '{{property}}' },
  { name: 'city', label: 'City', placeholder: '{{city}}' },
  { name: 'email', label: 'Email', placeholder: '{{email}}' },
  { name: 'source', label: 'Source', placeholder: '{{source}}' },
  { name: 'status', label: 'Status', placeholder: '{{status}}' },
  { name: 'first_name', label: 'First Name', placeholder: '{{first_name}}' },
  { name: 'last_name', label: 'Last Name', placeholder: '{{last_name}}' },
] as const;
