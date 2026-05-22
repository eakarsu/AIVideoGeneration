import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function VideoBriefPdf() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/projects')
      .then(r => {
        setProjects(r.data);
        if (r.data.length > 0) setProjectId(String(r.data[0].id));
      })
      .catch(e => setErr(e.response?.data?.error || 'Failed to load projects'));
  }, []);

  const generate = async () => {
    if (!projectId) return;
    setLoading(true); setErr(null);
    try {
      const res = await api.get(`/custom-views/brief-pdf/${projectId}`, { responseType: 'text' });
      const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      setPreview(body);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to generate brief');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!preview) return;
    const blob = new Blob([preview], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brief-${projectId}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="video-brief-pdf" style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Video Brief PDF</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          style={{ padding: '6px 10px', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4 }}
        >
          {projects.length === 0 && <option value="">No projects</option>}
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button
          onClick={generate}
          disabled={!projectId || loading}
          style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}
        >
          {loading ? 'Generating...' : 'Generate Brief'}
        </button>
        <button
          onClick={download}
          disabled={!preview}
          style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 0, borderRadius: 4, cursor: preview ? 'pointer' : 'not-allowed' }}
        >
          Download PDF
        </button>
      </div>
      {err && <div style={{ color: '#ef4444', marginTop: 8 }}>{err}</div>}
      {preview && (
        <pre style={{
          marginTop: 12, background: '#0b1220', color: '#d1d5db', padding: 12,
          borderRadius: 4, maxHeight: 280, overflow: 'auto', fontSize: 12,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>{preview}</pre>
      )}
    </div>
  );
}
