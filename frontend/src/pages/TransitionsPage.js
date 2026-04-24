import React from 'react';
import CrudPage from '../components/CrudPage';
export default function TransitionsPage() {
  return <CrudPage title="Transitions" subtitle="Video transition effects between scenes" apiPath="/transitions"
    columns={[
      { key: 'name', label: 'Transition Name' },
      { key: 'type', label: 'Type', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'duration_ms', label: 'Duration', render: v => `${v}ms` },
      { key: 'easing', label: 'Easing' },
      { key: 'description', label: 'Description', render: v => v?.substring(0, 45) },
    ]}
    formFields={[
      { key: 'name', label: 'Transition Name', placeholder: 'e.g. Smooth Fade' },
      { key: 'type', label: 'Type', type: 'select', default: 'fade', options: [
        { value: 'fade', label: 'Fade' }, { value: 'dissolve', label: 'Dissolve' },
        { value: 'slide', label: 'Slide' }, { value: 'wipe', label: 'Wipe' },
        { value: 'zoom', label: 'Zoom' }, { value: 'shape', label: 'Shape' },
        { value: 'glitch', label: 'Glitch' }, { value: 'overlay', label: 'Overlay' },
        { value: 'cut', label: 'Cut' }, { value: 'blur', label: 'Blur' },
        { value: 'digital', label: 'Digital' }, { value: 'morph', label: 'Morph' },
      ]},
      { key: 'duration_ms', label: 'Duration (ms)', type: 'number', default: '500' },
      { key: 'easing', label: 'Easing', type: 'select', default: 'ease-in-out', options: [
        { value: 'linear', label: 'Linear' }, { value: 'ease-in', label: 'Ease In' },
        { value: 'ease-out', label: 'Ease Out' }, { value: 'ease-in-out', label: 'Ease In-Out' },
      ]},
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'config', label: 'Config (JSON)', type: 'json', default: '{}' },
    ]} />;
}
