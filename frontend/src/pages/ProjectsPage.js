import React from 'react';
import CrudPage from '../components/CrudPage';
const B = (v) => <span className={`badge badge-${v}`}>{v}</span>;
export default function ProjectsPage() {
  return <CrudPage title="Video Projects" subtitle="Manage your video production projects" apiPath="/projects"
    columns={[
      { key: 'name', label: 'Project Name' },
      { key: 'resolution', label: 'Resolution' },
      { key: 'fps', label: 'FPS' },
      { key: 'duration_seconds', label: 'Duration', render: v => `${v}s` },
      { key: 'status', label: 'Status', render: B },
      { key: 'style', label: 'Style', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'aspect_ratio', label: 'Aspect' },
    ]}
    formFields={[
      { key: 'name', label: 'Project Name', placeholder: 'e.g. Product Launch Video' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1920x1080', options: [
        { value: '1280x720', label: '720p' }, { value: '1920x1080', label: '1080p' },
        { value: '2560x1440', label: '1440p' }, { value: '3840x2160', label: '4K' },
        { value: '1080x1920', label: '1080x1920 (Vertical)' }, { value: '1080x1080', label: '1080x1080 (Square)' },
      ]},
      { key: 'fps', label: 'FPS', type: 'select', default: '24', options: [
        { value: '24', label: '24 fps (Film)' }, { value: '30', label: '30 fps' }, { value: '60', label: '60 fps' },
      ]},
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', default: '10' },
      { key: 'style', label: 'Style', type: 'select', default: 'cinematic', options: [
        { value: 'cinematic', label: 'Cinematic' }, { value: 'commercial', label: 'Commercial' },
        { value: 'documentary', label: 'Documentary' }, { value: 'editorial', label: 'Editorial' },
        { value: 'sci-fi', label: 'Sci-Fi' }, { value: 'romantic', label: 'Romantic' },
        { value: 'abstract', label: 'Abstract' }, { value: 'corporate', label: 'Corporate' },
      ]},
      { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', default: '16:9', options: [
        { value: '16:9', label: '16:9' }, { value: '9:16', label: '9:16 (Vertical)' },
        { value: '1:1', label: '1:1 (Square)' }, { value: '21:9', label: '21:9 (Ultra-wide)' },
      ]},
      { key: 'status', label: 'Status', type: 'select', default: 'draft', options: [
        { value: 'draft', label: 'Draft' }, { value: 'in_progress', label: 'In Progress' },
        { value: 'rendering', label: 'Rendering' }, { value: 'completed', label: 'Completed' },
        { value: 'queued', label: 'Queued' },
      ]},
    ]} />;
}
