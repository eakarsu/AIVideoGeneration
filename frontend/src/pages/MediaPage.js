import React from 'react';
import CrudPage from '../components/CrudPage';
export default function MediaPage() {
  return <CrudPage title="Media Library" subtitle="Manage your video, audio, and image assets" apiPath="/media"
    columns={[
      { key: 'name', label: 'File Name' },
      { key: 'type', label: 'Type', render: v => <span className={`badge ${v === 'video' ? 'badge-info' : v === 'audio' ? 'badge-success' : v === 'image' ? 'badge-warning' : 'badge-draft'}`}>{v}</span> },
      { key: 'format', label: 'Format' },
      { key: 'file_size', label: 'Size' },
      { key: 'resolution', label: 'Resolution', render: v => v || '—' },
      { key: 'duration_seconds', label: 'Duration', render: v => v ? `${v}s` : '—' },
    ]}
    formFields={[
      { key: 'name', label: 'File Name', placeholder: 'e.g. sunset_4k.mp4' },
      { key: 'type', label: 'Type', type: 'select', default: 'video', options: [
        { value: 'video', label: 'Video' }, { value: 'audio', label: 'Audio' },
        { value: 'image', label: 'Image' }, { value: 'other', label: 'Other' },
      ]},
      { key: 'url', label: 'File URL/Path', placeholder: '/media/filename.mp4' },
      { key: 'file_size', label: 'File Size', placeholder: '2.3GB' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number' },
      { key: 'resolution', label: 'Resolution', placeholder: '1920x1080' },
      { key: 'format', label: 'Format', default: 'mp4', placeholder: 'mp4, wav, png...' },
      { key: 'tags', label: 'Tags (JSON)', type: 'json', default: '[]', placeholder: '["nature","4k"]' },
    ]} />;
}
