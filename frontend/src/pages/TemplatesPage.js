import React from 'react';
import CrudPage from '../components/CrudPage';
export default function TemplatesPage() {
  return <CrudPage title="Video Templates" subtitle="Pre-built video templates for quick creation" apiPath="/templates"
    columns={[
      { key: 'name', label: 'Template Name' },
      { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'resolution', label: 'Resolution' },
      { key: 'duration_seconds', label: 'Duration', render: v => `${v}s` },
      { key: 'style', label: 'Style' },
    ]}
    formFields={[
      { key: 'name', label: 'Template Name', placeholder: 'e.g. Product Showcase' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'category', label: 'Category', type: 'select', default: 'general', options: [
        { value: 'commercial', label: 'Commercial' }, { value: 'social', label: 'Social Media' },
        { value: 'film', label: 'Film' }, { value: 'broadcast', label: 'Broadcast' },
        { value: 'event', label: 'Event' }, { value: 'branding', label: 'Branding' },
        { value: 'travel', label: 'Travel' }, { value: 'education', label: 'Education' },
        { value: 'music', label: 'Music' }, { value: 'real_estate', label: 'Real Estate' },
        { value: 'fitness', label: 'Fitness' }, { value: 'food', label: 'Food' },
        { value: 'creative', label: 'Creative' }, { value: 'podcast', label: 'Podcast' },
      ]},
      { key: 'resolution', label: 'Resolution', default: '1920x1080' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', default: '15' },
      { key: 'style', label: 'Style', default: 'modern' },
      { key: 'config', label: 'Config (JSON)', type: 'json', default: '{}' },
    ]} />;
}
