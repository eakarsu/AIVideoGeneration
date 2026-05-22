import React, { useEffect, useState } from 'react';
import api from '../services/api';

const blankForm = { name: '', resolution: '1920x1080', length_seconds: 30, max_size_mb: 100, format: 'mp4', notes: '' };

export default function GenerationRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/custom-views/rules')
      .then(r => setRules(r.data))
      .catch(e => setErr(e.response?.data?.error || 'Failed to load rules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const reset = () => { setForm(blankForm); setEditingId(null); };

  const submit = async () => {
    setErr(null);
    try {
      if (editingId) {
        await api.put(`/custom-views/rules/${editingId}`, form);
      } else {
        await api.post('/custom-views/rules', form);
      }
      reset(); load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Save failed');
    }
  };

  const edit = (rule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name || '',
      resolution: rule.resolution || '1920x1080',
      length_seconds: rule.length_seconds || 30,
      max_size_mb: rule.max_size_mb || 100,
      format: rule.format || 'mp4',
      notes: rule.notes || '',
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete rule?')) return;
    try { await api.delete(`/custom-views/rules/${id}`); load(); }
    catch (e) { setErr(e.response?.data?.error || 'Delete failed'); }
  };

  const inputStyle = { padding: '6px 8px', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4, width: '100%' };
  const btn = (bg) => ({ padding: '6px 12px', background: bg, color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' });

  return (
    <div data-testid="generation-rules-editor" style={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0, color: '#e5e7eb' }}>Generation Rules Editor</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input style={inputStyle} placeholder="Name" value={form.name} onChange={e => update('name', e.target.value)} />
        <input style={inputStyle} placeholder="Resolution (e.g. 1920x1080)" value={form.resolution} onChange={e => update('resolution', e.target.value)} />
        <input style={inputStyle} type="number" placeholder="Length (s)" value={form.length_seconds} onChange={e => update('length_seconds', e.target.value)} />
        <input style={inputStyle} type="number" placeholder="Max size (MB)" value={form.max_size_mb} onChange={e => update('max_size_mb', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto auto', gap: 8, marginBottom: 12 }}>
        <select style={inputStyle} value={form.format} onChange={e => update('format', e.target.value)}>
          <option value="mp4">mp4</option>
          <option value="mov">mov</option>
          <option value="webm">webm</option>
        </select>
        <input style={inputStyle} placeholder="Notes" value={form.notes} onChange={e => update('notes', e.target.value)} />
        <button style={btn('#3b82f6')} onClick={submit}>{editingId ? 'Update' : 'Create'}</button>
        {editingId && <button style={btn('#6b7280')} onClick={reset}>Cancel</button>}
      </div>
      {err && <div style={{ color: '#ef4444', marginBottom: 8 }}>{err}</div>}
      {loading ? (
        <div style={{ color: '#9ca3af' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', color: '#e5e7eb', fontSize: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#9ca3af', borderBottom: '1px solid #374151' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Resolution</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Length</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Max MB</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Format</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Notes</th>
              <th style={{ textAlign: 'right', padding: 6 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={{ padding: 6 }}>{r.name}</td>
                <td style={{ padding: 6 }}>{r.resolution}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{r.length_seconds}s</td>
                <td style={{ padding: 6, textAlign: 'right' }}>{r.max_size_mb}</td>
                <td style={{ padding: 6 }}>{r.format}</td>
                <td style={{ padding: 6, color: '#9ca3af' }}>{r.notes}</td>
                <td style={{ padding: 6, textAlign: 'right' }}>
                  <button style={{ ...btn('#374151'), marginRight: 6 }} onClick={() => edit(r)}>Edit</button>
                  <button style={btn('#ef4444')} onClick={() => remove(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 12, textAlign: 'center', color: '#9ca3af' }}>No rules yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
