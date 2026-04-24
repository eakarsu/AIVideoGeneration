import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilm, FiType, FiImage, FiGrid, FiLayers, FiVideo, FiFolder, FiShuffle, FiMusic, FiDroplet, FiClock, FiDownload, FiEdit3 } from 'react-icons/fi';
import api from '../services/api';

const cards = [
  { key: 'projects', label: 'Video Projects', icon: FiFilm, path: '/projects', color: '#8b5cf6' },
  { key: 'text2video', label: 'Text to Video', icon: FiType, path: '/text2video', color: '#ec4899' },
  { key: 'img2video', label: 'Image to Video', icon: FiImage, path: '/img2video', color: '#f59e0b' },
  { key: 'templates', label: 'Templates', icon: FiGrid, path: '/templates', color: '#10b981' },
  { key: 'storyboards', label: 'Storyboards', icon: FiLayers, path: '/storyboards', color: '#3b82f6' },
  { key: 'scenes', label: 'Scenes', icon: FiVideo, path: '/scenes', color: '#6366f1' },
  { key: 'media', label: 'Media Library', icon: FiFolder, path: '/media', color: '#14b8a6' },
  { key: 'transitions', label: 'Transitions', icon: FiShuffle, path: '/transitions', color: '#f97316' },
  { key: 'audio', label: 'Audio Tracks', icon: FiMusic, path: '/audio', color: '#a855f7' },
  { key: 'styles', label: 'Video Styles', icon: FiDroplet, path: '/styles', color: '#06b6d4' },
  { key: 'renders', label: 'Render Queue', icon: FiClock, path: '/renderqueue', color: '#ef4444' },
  { key: 'exports', label: 'Export Presets', icon: FiDownload, path: '/exports', color: '#84cc16' },
  { key: 'prompts', label: 'AI Prompts', icon: FiEdit3, path: '/prompts', color: '#e879f9' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  useEffect(() => { api.get('/dashboard').then(r => setStats(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">AI Video Generation Platform Overview</p></div>
      </div>
      <div className="dashboard-grid">
        {cards.map(c => (
          <div key={c.key} className="stat-card" onClick={() => navigate(c.path)}>
            <div className="stat-icon"><c.icon size={32} color={c.color} /></div>
            <div className="stat-value">{stats[c.key] ?? '—'}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
