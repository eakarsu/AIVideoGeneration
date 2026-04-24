import React from 'react';
import CrudPage from '../components/CrudPage';
export default function ExportsPage() {
  return <CrudPage title="Export Presets" subtitle="Configure output format presets for video export" apiPath="/exports"
    columns={[
      { key: 'name', label: 'Preset Name' },
      { key: 'format', label: 'Format', render: v => <span className="badge badge-info">{v}</span> },
      { key: 'codec', label: 'Codec' },
      { key: 'resolution', label: 'Resolution' },
      { key: 'bitrate', label: 'Bitrate' },
      { key: 'fps', label: 'FPS' },
      { key: 'quality', label: 'Quality' },
    ]}
    formFields={[
      { key: 'name', label: 'Preset Name', placeholder: 'e.g. YouTube 4K' },
      { key: 'format', label: 'Format', type: 'select', default: 'mp4', options: [
        { value: 'mp4', label: 'MP4' }, { value: 'mov', label: 'MOV' },
        { value: 'webm', label: 'WebM' }, { value: 'gif', label: 'GIF' },
        { value: 'mxf', label: 'MXF' },
      ]},
      { key: 'codec', label: 'Codec', type: 'select', default: 'h264', options: [
        { value: 'h264', label: 'H.264' }, { value: 'h265', label: 'H.265 (HEVC)' },
        { value: 'prores_422', label: 'ProRes 422' }, { value: 'dnxhd', label: 'DNxHD' },
        { value: 'vp9', label: 'VP9' }, { value: 'gif', label: 'GIF' },
        { value: 'jpeg2000', label: 'JPEG 2000' },
      ]},
      { key: 'resolution', label: 'Resolution', default: '1920x1080' },
      { key: 'bitrate', label: 'Bitrate', default: '8000k' },
      { key: 'fps', label: 'FPS', type: 'number', default: '24' },
      { key: 'quality', label: 'Quality', type: 'select', default: 'high', options: [
        { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }, { value: 'lossless', label: 'Lossless' },
        { value: 'cinema', label: 'Cinema' },
      ]},
      { key: 'description', label: 'Description', type: 'textarea' },
    ]} />;
}
