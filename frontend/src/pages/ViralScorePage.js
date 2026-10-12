
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples.jsx";
import FormattedAIReport from "../components/FormattedAIReport";
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiTrendingUp, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function ViralScorePage() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({
    concept: '',
    platform: 'tiktok',
    audience: '',
    duration: '30 seconds',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/ai/viral-score', form);
      setResult(data);
      toast.success('Viral score computed');
    } catch (err) {
      const msg = err.response?.data?.error || 'Request failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const score = result?.score ?? result?.viral_score ?? result?.viralScore;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><FiTrendingUp style={{ verticalAlign: 'middle' }} /> Viral Score Prediction</h1>
          <p className="page-subtitle">Estimate viral potential and platform fit for a video concept</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <form onSubmit={submit} data-full-ai-workspace="ViralScorePage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Concept *</label>
              <textarea rows="3" value={form.concept} onChange={set('concept')} required
                placeholder="Describe the video concept, hook, and key beats" data-full-ai-field={fullAIExamples.bind({ current: form.concept, change: set('concept'), label: "form.concept", manual: false, json: false, sample: ['A 30-second behind-the-scenes coffee roasting clip with a close-up opening and a final cup reveal.', 'A short running shoe comparison showing grip on wet pavement, followed by a clear takeaway.', 'A compact before-and-after room styling video with three affordable changes and a final reveal.'] }, "p1-1823", undefined)} />
            </div>
            <div className="form-group">
              <label>Platform</label>
              <select value={form.platform} onChange={set('platform')} data-full-ai-field={fullAIExamples.bind({ current: form.platform, change: set('platform'), label: "form.platform", manual: false, json: false, sample: 'tiktok' }, "p1-2091", undefined)}>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram Reels</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </div>
            <div className="form-group">
              <label>Audience</label>
              <input value={form.audience} onChange={set('audience')} placeholder="e.g. Gen Z fashion" data-full-ai-field={fullAIExamples.bind({ current: form.audience, change: set('audience'), label: "form.audience", manual: false, json: false, sample: ['Specialty coffee fans', 'Recreational runners', 'Budget-conscious renters'] }, "p1-2471", undefined)} />
            </div>
            <div className="form-group">
              <label>Duration</label>
              <input value={form.duration} onChange={set('duration')} placeholder="e.g. 30 seconds" data-full-ai-field={fullAIExamples.bind({ current: form.duration, change: set('duration'), label: "form.duration", manual: false, json: false, sample: '30 seconds' }, "p1-2675", undefined)} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FiZap size={14} /> {loading ? 'Scoring…' : 'Predict Viral Score'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="card" style={{ padding: 12, marginBottom: 12, borderColor: 'var(--error, #b91c1c)', color: 'var(--error, #b91c1c)' }}>{error}</div>}

      {result && (
        <div className="ai-response">
          <div className="ai-response-header">
            <strong>Viral Potential</strong>
            {typeof score !== 'undefined' && (
              <span className="badge badge-info" style={{ marginLeft: 8 }}>Score: {score}</span>
            )}
          </div>
          <div className="ai-response-body">
            <FormattedAIReport response={result} />
          </div>
        </div>
      )}
    </div>
  );
}
