import React from 'react';
import CrudPage from '../components/CrudPage';
const B = (v) => <span className={`badge badge-${v}`}>{v}</span>;
export default function Img2VideoPage() {
  return <CrudPage title="Image to Video" subtitle="Animate images into stunning videos" apiPath="/img2video"
    columns={[
      { key: 'name', label: 'Name' },
      { key: 'motion_prompt', label: 'Motion', render: v => v?.substring(0, 50) },
      { key: 'model', label: 'Model', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'status', label: 'Status', render: B },
      { key: 'duration_seconds', label: 'Duration', render: v => `${v}s` },
      { key: 'motion_strength', label: 'Strength' },
    ]}
    formFields={[
      { key: 'name', label: 'Name', placeholder: 'e.g. Sunset Beach Animation' },
      { key: 'image_url', label: 'Image URL', placeholder: 'URL of the source image' },
      { key: 'motion_prompt', label: 'Motion Prompt', type: 'textarea', placeholder: 'Describe the motion...' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', default: '4' },
      { key: 'motion_strength', label: 'Motion Strength (0-1)', type: 'number', default: '0.7' },
      { key: 'model', label: 'Model', type: 'select', default: 'stable-video-diffusion', options: [
        { value: 'stable-video-diffusion', label: 'Stable Video Diffusion' },
        { value: 'animatediff', label: 'AnimateDiff' },
      ]},
      { key: 'status', label: 'Status', type: 'select', default: 'pending', options: [
        { value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' },
      ]},
    ]} />;
}
