import RecordDialog from './RecordDialog';
import { AIResultValue } from './AIResultView';
import AIFieldPresets, { completeExample } from './AIFieldPresets';
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import { recordList } from '../services/recordList';

export default function CrudPage({ title, subtitle, apiPath, columns, formFields, renderDetail }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});

  const load = useCallback(async () => {
    try { setItems(recordList((await api.get(apiPath)).data)); }
    catch (error) { toast.error(error.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [apiPath]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    const defaults = {};
    formFields.forEach(f => { defaults[f.key] = f.default || ''; });
    setFormData(defaults);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    const data = {};
    formFields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'json' && typeof val === 'object') val = JSON.stringify(val, null, 2);
      data[f.key] = val ?? f.default ?? '';
    });
    setFormData(data);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      formFields.forEach(f => {
        if (f.type === 'json' && typeof payload[f.key] === 'string') { try { payload[f.key] = JSON.parse(payload[f.key]); } catch {} }
        if (f.type === 'number') payload[f.key] = Number(payload[f.key]);
      });
      if (editing) { await api.put(`${apiPath}/${editing.id}`, payload); toast.success('Updated'); }
      else { await api.post(apiPath, payload); toast.success('Created'); }
      setShowModal(false); setSelected(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`${apiPath}/${id}`); toast.success('Deleted'); if (selected?.id === id) setSelected(null); load(); }
    catch { toast.error('Delete failed'); }
  };

  const viewDetail = async (item) => {
    try { setSelected((await api.get(`${apiPath}/${item.id}`)).data); }
    catch { setSelected(item); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const singularTitle = title.replace(/ies$/, 'y').replace(/s$/, '');
  const aiPromptForm = /text to video|image to video|prompt|storyboard|scene|style recommend|viral score/i.test(title);
  const videoPresets = /text to video/i.test(title) ? [
    { label: 'Coastal sunrise', values: { prompt: 'Wide cinematic shot of a quiet shoreline at sunrise. Slow dolly forward, gentle waves, warm natural light, no people.', negative_prompt: 'Text overlays, flicker, distorted horizon, abrupt cuts', style: 'cinematic' } },
    { label: 'Product close-up', values: { prompt: 'A ceramic coffee cup on a wooden table beside a window. Slow orbit, rising steam, soft morning light, clean background.', negative_prompt: 'Logos, extra objects, warped cup, jitter', style: 'realistic' } },
    { label: 'City night scene', values: { prompt: 'Rain on a city street at dusk, reflections from storefront lights, a slow tracking shot past pedestrians under umbrellas.', negative_prompt: 'Unreadable signs, camera shake, duplicated people', style: 'cinematic' } },
  ] : /image to video/i.test(title) ? [
    { label: 'Gentle landscape motion', values: { name: 'Landscape motion study', motion_prompt: 'Gently move the camera forward as clouds drift and grass sways in a light breeze.' } },
    { label: 'Product turntable', values: { name: 'Product turntable study', motion_prompt: 'Slowly orbit the product with steady lighting and a fixed background.' } },
    { label: 'Portrait parallax', values: { name: 'Portrait parallax study', motion_prompt: 'Add subtle background parallax and a slow camera push while preserving the subject.' } },
  ] : /ai prompts/i.test(title) ? [
    { label: 'Nature film prompt', values: { name: 'Coastal sunrise', prompt: 'A wide shot of a quiet shoreline at sunrise. Slow dolly forward, soft amber light, gentle surf, realistic water motion.', negative_prompt: 'Text, logos, flicker, warped horizon', category: 'nature', style: 'cinematic', tags: ['coast', 'sunrise', 'water'] } },
    { label: 'Food film prompt', values: { name: 'Morning coffee', prompt: 'Close-up of coffee being poured into a ceramic cup beside a window. Slow camera orbit, visible steam, natural morning light.', negative_prompt: 'Labels, extra hands, distorted cup', category: 'food', style: 'realistic', tags: ['coffee', 'product', 'morning'] } },
    { label: 'Urban film prompt', values: { name: 'Rainy city evening', prompt: 'Street level tracking shot after rain at dusk. Storefront lights reflect in puddles as pedestrians cross the frame.', negative_prompt: 'Unclear signs, duplicate pedestrians, sudden cuts', category: 'urban', style: 'cinematic', tags: ['city', 'rain', 'dusk'] } },
  ] : /storyboards/i.test(title) ? [
    { label: 'Coffee launch', values: { title: 'Coffee launch sequence', description: 'A short product introduction moving from beans to a finished cup.', scenes: [{ scene: 'Opening', desc: 'Macro shot of roasted beans' }, { scene: 'Reveal', desc: 'Coffee pours into a ceramic cup' }] } },
    { label: 'Outdoor product', values: { title: 'Outdoor product sequence', description: 'A compact story showing a reusable bottle on a day hike.', scenes: [{ scene: 'Trail', desc: 'Wide trail establishing shot' }, { scene: 'Product', desc: 'Bottle close-up at rest stop' }] } },
    { label: 'Studio portrait', values: { title: 'Portrait session sequence', description: 'A soft natural-light portrait progression.', scenes: [{ scene: 'Setup', desc: 'Window light and studio details' }, { scene: 'Portrait', desc: 'Slow push toward the subject' }] } },
  ] : /scenes/i.test(title) ? [
    { label: 'Coast opening', values: { name: 'Coast opening', description: 'Establish the shoreline in warm early light.', prompt: 'Wide coastline at sunrise, gentle surf, slow forward camera movement, natural color.' } },
    { label: 'Coffee detail', values: { name: 'Coffee detail', description: 'Show the product texture and steam.', prompt: 'Close-up of a fresh coffee pour, ceramic cup, window light, slow camera orbit.' } },
    { label: 'City transition', values: { name: 'City transition', description: 'Introduce an evening urban setting.', prompt: 'Rainy city street at dusk, reflected storefront lights, steady tracking shot.' } },
  ] : undefined;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">{title}</h1><p className="page-subtitle">{subtitle}</p></div>
        <button className="btn btn-primary" onClick={openNew}><FiPlus size={14} /> New {singularTitle}</button>
      </div>

      {selected && (
        <RecordDialog title={title} onClose={() => setSelected(null)}><div className="detail-panel">
          <div className="detail-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelected(null)}><FiArrowLeft size={14} /></button>
              <h2 className="detail-title">{selected.name || selected.title || selected.project_name || selected.key || `#${selected.id}`}</h2>
            </div>
            <div className="detail-actions">
              <button className="btn btn-sm btn-primary" onClick={() => openEdit(selected)}><FiEdit2 size={14} /> Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(selected.id)}><FiTrash2 size={14} /> Delete</button>
            </div>
          </div>
          <div className="detail-body">
            {renderDetail ? renderDetail(selected) : (
              <div className="detail-grid">
                {Object.entries(selected).map(([key, value]) => (
                  <div key={key}>
                    <div className="detail-label">{key.replace(/_/g, ' ')}</div>
                    <div className="detail-value">
                      {typeof value === 'object' && value !== null ? <AIResultValue value={value} />
                        : typeof value === 'boolean' ? <span className={`badge ${value ? 'badge-success' : 'badge-error'}`}>{String(value)}</span>
                        : String(value ?? '—')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div></RecordDialog>
      )}

      <div className="table-container">
        <table>
          <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}<th style={{ width: 100 }}>Actions</th></tr></thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No items found</td></tr>
            ) : items.map(item => (
              <tr key={item.id} onClick={() => viewDetail(item)} tabIndex={0} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); (() => viewDetail(item))(event); } }}>
                {columns.map(c => (
                  <td key={c.key}>{c.render ? c.render(item[c.key], item) : String(item[c.key] ?? '—').substring(0, 80)}</td>
                ))}
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-icon btn-secondary" onClick={() => openEdit(item)}><FiEdit2 size={13} /></button>
                    <button className="btn btn-sm btn-icon btn-danger" onClick={() => handleDelete(item.id)}><FiTrash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit' : 'New'} {singularTitle}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              {aiPromptForm && <AIFieldPresets fields={formFields} samples={videoPresets} context={title} onFill={(sample, variant) => setFormData(current => ({ ...current, ...completeExample(formFields, sample, variant, title, current) }))} />}
              {formFields.map(f => (
                <div className="form-group" key={f.key}>
                  <label className="form-label">{f.label}</label>
                  {f.type === 'select' ? (
                    <select className="form-select" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' || f.type === 'json' ? (
                    <textarea className="form-textarea" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} rows={f.type === 'json' ? 6 : 4} placeholder={f.placeholder} />
                  ) : (
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  )}
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
