import React from 'react';
import CrudPage from '../components/CrudPage';
export default function PromptsPage() {
  return <CrudPage title="AI Prompts" subtitle="Curated prompt library for video generation" apiPath="/prompts"
    columns={[
      { key: 'name', label: 'Prompt Name' },
      { key: 'category', label: 'Category', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'style', label: 'Style' },
      { key: 'prompt', label: 'Prompt', render: v => v?.substring(0, 55) + '...' },
      { key: 'tags', label: 'Tags', render: v => {
        const tags = typeof v === 'string' ? JSON.parse(v || '[]') : (v || []);
        return <div className="tag-list">{tags.slice(0, 3).map((t, i) => <span key={i} className="tag">{t}</span>)}</div>;
      }},
    ]}
    formFields={[
      { key: 'name', label: 'Prompt Name', placeholder: 'e.g. Cinematic Sunset' },
      { key: 'prompt', label: 'Video Prompt', type: 'textarea', placeholder: 'Detailed prompt for video generation...' },
      { key: 'negative_prompt', label: 'Negative Prompt', type: 'textarea', placeholder: 'What to avoid...' },
      { key: 'category', label: 'Category', type: 'select', default: 'general', options: [
        { value: 'nature', label: 'Nature' }, { value: 'urban', label: 'Urban' },
        { value: 'space', label: 'Space' }, { value: 'fantasy', label: 'Fantasy' },
        { value: 'abstract', label: 'Abstract' }, { value: 'food', label: 'Food' },
        { value: 'lifestyle', label: 'Lifestyle' }, { value: 'tech', label: 'Technology' },
      ]},
      { key: 'style', label: 'Style', default: 'cinematic', placeholder: 'cinematic, anime, realistic...' },
      { key: 'tags', label: 'Tags (JSON)', type: 'json', default: '[]', placeholder: '["sunset","ocean"]' },
    ]} />;
}
