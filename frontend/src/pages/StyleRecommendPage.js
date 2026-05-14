import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiDroplet, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function StyleRecommendPage() {
  const [form, setForm] = useState({
    brand: '',
    industry: '',
    audience: '',
    mood: 'cinematic',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/ai/style-recommend', form);
      setResult(data);
      toast.success('Style recommendations generated');
    } catch (err) {
      const msg = err.response?.data?.error || 'Request failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiDroplet style={{ verticalAlign: 'middle' }} /> Style Recommendation</h1>
          <p className="page-subtitle">AI-driven visual-style recommendations based on brand and audience</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <div className="form-group">
              <label>Brand</label>
              <input value={form.brand} onChange={set('brand')} placeholder="e.g. Acme Coffee" />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <input value={form.industry} onChange={set('industry')} placeholder="e.g. specialty beverage" />
            </div>
            <div className="form-group">
              <label>Audience</label>
              <input value={form.audience} onChange={set('audience')} placeholder="e.g. urban millennials" />
            </div>
            <div className="form-group">
              <label>Mood</label>
              <select value={form.mood} onChange={set('mood')}>
                <option value="cinematic">Cinematic</option>
                <option value="energetic">Energetic</option>
                <option value="dreamy">Dreamy</option>
                <option value="dramatic">Dramatic</option>
                <option value="playful">Playful</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FiZap size={14} /> {loading ? 'Analyzing…' : 'Recommend Style'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: 'var(--error, #b91c1c)', color: 'var(--error, #b91c1c)' }}>{error}</div>}

      {result && (
        <div className="ai-response">
          <div className="ai-response-header"><strong>Style Recommendation</strong></div>
          <div className="ai-response-body">
            {typeof (result.result || result.recommendation || result.message) === 'string' ? (
              <ReactMarkdown>{result.result || result.recommendation || result.message}</ReactMarkdown>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
