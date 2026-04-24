import React from 'react';
import CrudPage from '../components/CrudPage';
export default function AudioPage() {
  return <CrudPage title="Audio Tracks" subtitle="Manage music, sound effects, and ambient audio" apiPath="/audio"
    columns={[
      { key: 'name', label: 'Track Name' },
      { key: 'type', label: 'Type', render: v => <span className={`badge ${v === 'music' ? 'badge-info' : v === 'sfx' ? 'badge-warning' : 'badge-success'}`}>{v}</span> },
      { key: 'genre', label: 'Genre' },
      { key: 'mood', label: 'Mood' },
      { key: 'duration_seconds', label: 'Duration', render: v => v < 60 ? `${v}s` : `${Math.floor(v/60)}m ${v%60}s` },
      { key: 'bpm', label: 'BPM', render: v => v || '—' },
      { key: 'license', label: 'License' },
    ]}
    formFields={[
      { key: 'name', label: 'Track Name', placeholder: 'e.g. Epic Cinematic Rise' },
      { key: 'type', label: 'Type', type: 'select', default: 'music', options: [
        { value: 'music', label: 'Music' }, { value: 'sfx', label: 'Sound Effect' },
        { value: 'ambience', label: 'Ambience' }, { value: 'voiceover', label: 'Voice Over' },
      ]},
      { key: 'url', label: 'Audio URL', placeholder: '/audio/track.mp3' },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number' },
      { key: 'bpm', label: 'BPM', type: 'number' },
      { key: 'genre', label: 'Genre', placeholder: 'orchestral, electronic, jazz...' },
      { key: 'mood', label: 'Mood', placeholder: 'epic, relaxed, tense...' },
      { key: 'license', label: 'License', type: 'select', default: 'royalty-free', options: [
        { value: 'royalty-free', label: 'Royalty Free' }, { value: 'creative-commons', label: 'Creative Commons' },
        { value: 'licensed', label: 'Licensed' }, { value: 'original', label: 'Original' },
      ]},
    ]} />;
}
