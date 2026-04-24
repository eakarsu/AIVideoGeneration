import React from 'react';
import CrudPage from '../components/CrudPage';
export default function SettingsPage() {
  return <CrudPage title="Settings" subtitle="Platform configuration and preferences" apiPath="/settings"
    columns={[
      { key: 'key', label: 'Setting' },
      { key: 'value', label: 'Value' },
      { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'description', label: 'Description', render: v => v?.substring(0, 50) },
    ]}
    formFields={[
      { key: 'key', label: 'Setting Key', placeholder: 'e.g. default_resolution' },
      { key: 'value', label: 'Value', placeholder: 'Setting value' },
      { key: 'category', label: 'Category', type: 'select', default: 'general', options: [
        { value: 'general', label: 'General' }, { value: 'video', label: 'Video' },
        { value: 'rendering', label: 'Rendering' }, { value: 'ai', label: 'AI' },
        { value: 'uploads', label: 'Uploads' }, { value: 'media', label: 'Media' },
        { value: 'export', label: 'Export' }, { value: 'ui', label: 'UI' },
      ]},
      { key: 'description', label: 'Description', type: 'textarea' },
    ]} />;
}
