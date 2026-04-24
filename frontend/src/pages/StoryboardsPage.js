import React from 'react';
import CrudPage from '../components/CrudPage';
const B = (v) => <span className={`badge badge-${v}`}>{v}</span>;
export default function StoryboardsPage() {
  return <CrudPage title="Storyboards" subtitle="Plan your video scenes and narrative flow" apiPath="/storyboards"
    columns={[
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description', render: v => v?.substring(0, 50) },
      { key: 'project_id', label: 'Project ID' },
      { key: 'status', label: 'Status', render: B },
    ]}
    formFields={[
      { key: 'title', label: 'Storyboard Title', placeholder: 'e.g. Product Launch Campaign' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'project_id', label: 'Project ID', type: 'number' },
      { key: 'scenes', label: 'Scenes (JSON)', type: 'json', default: '[]', placeholder: '[{"scene":"Scene 1","desc":"Description"}]' },
      { key: 'status', label: 'Status', type: 'select', default: 'draft', options: [
        { value: 'draft', label: 'Draft' }, { value: 'in_progress', label: 'In Progress' },
        { value: 'approved', label: 'Approved' }, { value: 'completed', label: 'Completed' },
      ]},
    ]} />;
}
