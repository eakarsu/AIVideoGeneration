import React from 'react';
import CrudPage from '../components/CrudPage';
export default function StylesPage() {
  return <CrudPage title="Video Styles" subtitle="Visual style presets for AI video generation" apiPath="/styles"
    columns={[
      { key: 'name', label: 'Style Name' },
      { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'description', label: 'Description', render: v => v?.substring(0, 50) },
      { key: 'prompt_modifier', label: 'Prompt Modifier', render: v => v?.substring(0, 40) },
    ]}
    formFields={[
      { key: 'name', label: 'Style Name', placeholder: 'e.g. Cinematic Film' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'prompt_modifier', label: 'Prompt Modifier', type: 'textarea', placeholder: 'Text to append to prompts for this style...' },
      { key: 'negative_prompt', label: 'Negative Prompt', type: 'textarea', placeholder: 'What to avoid...' },
      { key: 'category', label: 'Category', type: 'select', default: 'artistic', options: [
        { value: 'cinematic', label: 'Cinematic' }, { value: 'artistic', label: 'Artistic' },
        { value: 'anime', label: 'Anime' }, { value: 'sci-fi', label: 'Sci-Fi' },
        { value: 'vintage', label: 'Vintage' }, { value: 'modern', label: 'Modern' },
        { value: 'noir', label: 'Noir' }, { value: 'ethereal', label: 'Ethereal' },
        { value: 'documentary', label: 'Documentary' }, { value: 'retro', label: 'Retro' },
        { value: 'nature', label: 'Nature' }, { value: 'illustration', label: 'Illustration' },
      ]},
      { key: 'config', label: 'Config (JSON)', type: 'json', default: '{}' },
    ]} />;
}
