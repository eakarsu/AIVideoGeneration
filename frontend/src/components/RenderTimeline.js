import React, { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
  queued: '#6b7280',
  rendering: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  paused: '#f59e0b',
};

export default function RenderTimeline() {
  const [data, setData] = useState({ items: [], min_ts: 0, max_ts: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/render-timeline')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load timeline'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading timeline...</div>;
  if (err) return <div style={{ padding: 12, color: '#ef4444' }}>{err}</div>;
  if (!data.items || data.items.length === 0) {
    return <div style={{ padding: 12, color: '#9ca3af' }}>No render jobs yet.</div>;
  }

  const span = Math.max(data.max_ts - data.min_ts, 1);

  return (
    <div data-testid="render-timeline" style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Render Queue Timeline</h3>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 12 }}>{data.items.length} jobs</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.items.map(item => {
          const leftPct = ((item.start_ts - data.min_ts) / span) * 100;
          const widthPct = Math.max((item.duration_ms / span) * 100, 1.5);
          const color = STATUS_COLORS[item.status] || '#6b7280';
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 160, color: '#e5e7eb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </div>
              <div style={{ flex: 1, height: 22, background: '#1f2937', position: 'relative', borderRadius: 4 }}>
                <div
                  title={`${item.label} – ${item.status} (${item.progress}%)`}
                  style={{
                    position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
                    top: 2, bottom: 2, background: color, borderRadius: 3,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
              <div style={{ width: 70, color: '#9ca3af', fontSize: 11, textAlign: 'right' }}>{item.status}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: '#9ca3af' }}>
        {Object.entries(STATUS_COLORS).map(([k, v]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 10, height: 10, background: v, borderRadius: 2, display: 'inline-block' }} />
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
