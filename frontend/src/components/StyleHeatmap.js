import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function StyleHeatmap() {
  const [data, setData] = useState({ styles: [], models: [], cells: [], max: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/custom-views/style-heatmap')
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load heatmap'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading heatmap...</div>;
  if (err) return <div style={{ padding: 12, color: '#ef4444' }}>{err}</div>;
  if (!data.styles.length || !data.models.length) {
    return <div style={{ padding: 12, color: '#9ca3af' }}>No style/model data yet.</div>;
  }

  const max = Math.max(data.max, 1);
  const lookup = {};
  data.cells.forEach(c => { lookup[`${c.style}||${c.model}`] = c.count; });

  const colorFor = (v) => {
    if (v === 0) return '#1f2937';
    const t = v / max;
    const hue = 200 - Math.round(t * 200); // 200 (cool) -> 0 (warm)
    const light = 28 + Math.round(t * 32);
    return `hsl(${hue},70%,${light}%)`;
  };

  return (
    <div data-testid="style-heatmap" style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 16, overflowX: 'auto' }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Style x Model Usage Heatmap</h3>
      <table style={{ borderCollapse: 'separate', borderSpacing: 2, color: '#e5e7eb', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: 4, textAlign: 'left', color: '#9ca3af' }}>Style \\ Model</th>
            {data.models.map(m => (
              <th key={m} style={{ padding: 4, color: '#9ca3af', fontWeight: 500, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }} title={m}>{m}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.styles.map(s => (
            <tr key={s}>
              <td style={{ padding: 4, color: '#9ca3af' }}>{s}</td>
              {data.models.map(m => {
                const v = lookup[`${s}||${m}`] || 0;
                return (
                  <td key={m} style={{
                    background: colorFor(v),
                    width: 60, height: 32, textAlign: 'center',
                    borderRadius: 3, color: v > max * 0.5 ? '#fff' : '#d1d5db',
                  }} title={`${s} × ${m}: ${v}`}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>Max cell value: {max}</div>
    </div>
  );
}
