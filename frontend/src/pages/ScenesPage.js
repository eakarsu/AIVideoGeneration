import React from 'react';
import CrudPage from '../components/CrudPage';
export default function ScenesPage() {
  return <CrudPage title="Scenes" subtitle="Manage individual video scenes and shots" apiPath="/scenes"
    columns={[
      { key: 'name', label: 'Scene Name' },
      { key: 'scene_order', label: 'Order' },
      { key: 'duration_seconds', label: 'Duration', render: v => `${v}s` },
      { key: 'camera_motion', label: 'Camera', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'transition_in', label: 'Trans In' },
      { key: 'transition_out', label: 'Trans Out' },
    ]}
    formFields={[
      { key: 'name', label: 'Scene Name', placeholder: 'e.g. Opening Shot' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'project_id', label: 'Project ID', type: 'number' },
      { key: 'scene_order', label: 'Scene Order', type: 'number', default: '1' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', default: '5' },
      { key: 'prompt', label: 'AI Generation Prompt', type: 'textarea', placeholder: 'Detailed scene description for AI...' },
      { key: 'camera_motion', label: 'Camera Motion', type: 'select', default: 'static', options: [
        { value: 'static', label: 'Static' }, { value: 'slow_pan_right', label: 'Slow Pan Right' },
        { value: 'slow_pan_left', label: 'Slow Pan Left' }, { value: 'slow_zoom_in', label: 'Slow Zoom In' },
        { value: 'zoom_out', label: 'Zoom Out' }, { value: 'drone_forward', label: 'Drone Forward' },
        { value: 'orbit_360', label: 'Orbit 360' }, { value: 'orbit_slow', label: 'Orbit Slow' },
        { value: 'tracking_shot', label: 'Tracking Shot' }, { value: 'top_down', label: 'Top Down' },
      ]},
      { key: 'transition_in', label: 'Transition In', type: 'select', default: 'fade', options: [
        { value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' },
        { value: 'crossfade', label: 'Crossfade' }, { value: 'slide', label: 'Slide' },
        { value: 'wipe', label: 'Wipe' }, { value: 'dissolve', label: 'Dissolve' },
        { value: 'glitch', label: 'Glitch' }, { value: 'smash_cut', label: 'Smash Cut' },
      ]},
      { key: 'transition_out', label: 'Transition Out', type: 'select', default: 'fade', options: [
        { value: 'none', label: 'None' }, { value: 'fade', label: 'Fade' },
        { value: 'crossfade', label: 'Crossfade' }, { value: 'slide', label: 'Slide' },
        { value: 'wipe', label: 'Wipe' }, { value: 'dissolve', label: 'Dissolve' },
        { value: 'morph', label: 'Morph' },
      ]},
    ]} />;
}
