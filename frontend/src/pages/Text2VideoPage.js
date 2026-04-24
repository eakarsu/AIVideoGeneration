import React from 'react';
import CrudPage from '../components/CrudPage';
const B = (v) => <span className={`badge badge-${v}`}>{v}</span>;
export default function Text2VideoPage() {
  return <CrudPage title="Text to Video" subtitle="Generate videos from text prompts using AI" apiPath="/text2video"
    columns={[
      { key: 'prompt', label: 'Prompt', render: v => v?.substring(0, 60) + '...' },
      { key: 'model', label: 'Model', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'status', label: 'Status', render: B },
      { key: 'duration_seconds', label: 'Duration', render: v => `${v}s` },
      { key: 'resolution', label: 'Resolution' },
      { key: 'style', label: 'Style' },
    ]}
    formFields={[
      { key: 'prompt', label: 'Video Prompt', type: 'textarea', placeholder: 'Describe the video you want to generate...' },
      { key: 'negative_prompt', label: 'Negative Prompt', type: 'textarea', placeholder: 'What to avoid in the video...' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', default: '4' },
      { key: 'resolution', label: 'Resolution', type: 'select', default: '1280x720', options: [
        { value: '512x512', label: '512x512' }, { value: '768x768', label: '768x768' },
        { value: '1280x720', label: '720p' }, { value: '1920x1080', label: '1080p' },
      ]},
      { key: 'fps', label: 'FPS', type: 'number', default: '24' },
      { key: 'style', label: 'Style', default: 'cinematic', placeholder: 'cinematic, anime, realistic...' },
      { key: 'model', label: 'Model', type: 'select', default: 'stable-video-diffusion', options: [
        { value: 'stable-video-diffusion', label: 'Stable Video Diffusion' },
        { value: 'zeroscope-v2', label: 'Zeroscope V2' },
        { value: 'animatediff', label: 'AnimateDiff' },
      ]},
      { key: 'status', label: 'Status', type: 'select', default: 'pending', options: [
        { value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' },
      ]},
    ]} />;
}
