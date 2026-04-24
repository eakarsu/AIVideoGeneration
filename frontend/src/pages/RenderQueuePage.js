import React from 'react';
import CrudPage from '../components/CrudPage';
const B = (v) => <span className={`badge badge-${v}`}>{v}</span>;
export default function RenderQueuePage() {
  return <CrudPage title="Render Queue" subtitle="Monitor video rendering progress and jobs" apiPath="/renderqueue"
    columns={[
      { key: 'project_name', label: 'Project' },
      { key: 'resolution', label: 'Resolution' },
      { key: 'format', label: 'Format' },
      { key: 'quality', label: 'Quality' },
      { key: 'status', label: 'Status', render: B },
      { key: 'progress', label: 'Progress', render: (v, item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${v}%` }} /></div>
          <span style={{ fontSize: 12 }}>{v}%</span>
        </div>
      )},
      { key: 'estimated_time', label: 'ETA', render: v => v || '—' },
    ]}
    formFields={[
      { key: 'project_name', label: 'Project Name', placeholder: 'e.g. Sunset Timelapse Final' },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1920x1080', options: [
        { value: '1280x720', label: '720p' }, { value: '1920x1080', label: '1080p' },
        { value: '2560x1440', label: '1440p' }, { value: '3840x2160', label: '4K' },
      ]},
      { key: 'format', label: 'Format', type: 'select', default: 'mp4', options: [
        { value: 'mp4', label: 'MP4' }, { value: 'mov', label: 'MOV' },
        { value: 'webm', label: 'WebM' }, { value: 'avi', label: 'AVI' },
      ]},
      { key: 'quality', label: 'Quality', type: 'select', default: 'high', options: [
        { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }, { value: 'ultra', label: 'Ultra' },
        { value: 'lossless', label: 'Lossless' },
      ]},
      { key: 'status', label: 'Status', type: 'select', default: 'queued', options: [
        { value: 'queued', label: 'Queued' }, { value: 'rendering', label: 'Rendering' },
        { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' },
        { value: 'paused', label: 'Paused' },
      ]},
      { key: 'progress', label: 'Progress (%)', type: 'number', default: '0' },
      { key: 'estimated_time', label: 'Estimated Time', placeholder: '05:30' },
      { key: 'output_url', label: 'Output URL', placeholder: '/output/video.mp4' },
    ]} />;
}
