import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiSend, FiPlus, FiTrash2, FiCpu, FiMessageSquare, FiFilm, FiLayers, FiEdit3, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const AI_TOOLS = [
  { id: 'chat', label: 'Chat', icon: FiMessageSquare, desc: 'General video production assistant', endpoint: '/ai/chat' },
  { id: 'generate-prompt', label: 'Generate Prompt', icon: FiEdit3, desc: 'Create detailed video prompts from descriptions', endpoint: '/ai/generate-prompt' },
  { id: 'generate-storyboard', label: 'Generate Storyboard', icon: FiLayers, desc: 'AI-powered storyboard creation', endpoint: '/ai/generate-storyboard' },
  { id: 'analyze-prompt', label: 'Analyze Prompt', icon: FiZap, desc: 'Analyze and improve your video prompts', endpoint: '/ai/analyze-prompt' },
  { id: 'generate-scene', label: 'Generate Scene', icon: FiFilm, desc: 'Create detailed scene descriptions', endpoint: '/ai/generate-scene' },
];

export default function AIChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    try { setConversations((await api.get('/ai/conversations')).data); } catch {}
  };

  const loadConversation = async (conv) => {
    try {
      const { data } = await api.get(`/ai/conversations/${conv.id}`);
      setActiveConv(data);
      setMessages(data.messages || []);
    } catch { toast.error('Failed to load'); }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete?')) return;
    try {
      await api.delete(`/ai/conversations/${id}`);
      if (activeConv?.id === id) { setActiveConv(null); setMessages([]); }
      loadConversations();
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const tool = AI_TOOLS.find(t => t.id === activeTool);
      let payload, data;

      if (activeTool === 'chat') {
        payload = { message: userMsg, conversation_id: activeConv?.id };
        data = (await api.post(tool.endpoint, payload)).data;
      } else if (activeTool === 'generate-prompt') {
        payload = { description: userMsg, style: 'cinematic', duration: '4 seconds', mood: 'dramatic' };
        data = (await api.post(tool.endpoint, payload)).data;
        data.message = data.result;
      } else if (activeTool === 'generate-storyboard') {
        payload = { concept: userMsg, num_scenes: 5, style: 'cinematic', duration: '30 seconds' };
        data = (await api.post(tool.endpoint, payload)).data;
        data.message = data.storyboard;
      } else if (activeTool === 'analyze-prompt') {
        payload = { prompt: userMsg };
        data = (await api.post(tool.endpoint, payload)).data;
        data.message = data.analysis;
      } else if (activeTool === 'generate-scene') {
        payload = { scene_concept: userMsg, style: 'cinematic', camera_motion: 'slow pan', mood: 'dramatic' };
        data = (await api.post(tool.endpoint, payload)).data;
        data.message = data.scene;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message || 'No response',
        usage: data.usage,
        model: data.model,
        tool: tool.label,
      }]);

      if (data.conversation_id && !activeConv) setActiveConv({ id: data.conversation_id });
      loadConversations();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI request failed';
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errMsg}` }]);
      toast.error(errMsg);
    } finally { setLoading(false); }
  };

  const placeholders = {
    'chat': 'Ask anything about video production...',
    'generate-prompt': 'Describe the video you want (e.g. "a sunset over the ocean")...',
    'generate-storyboard': 'Describe your video concept for storyboard generation...',
    'analyze-prompt': 'Paste a video prompt to analyze and improve...',
    'generate-scene': 'Describe a scene concept for detailed description...',
  };

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">AI Assistant</h1><p className="page-subtitle">AI-powered video production tools via OpenRouter</p></div>
      </div>

      <div className="ai-tools-grid">
        {AI_TOOLS.map(tool => (
          <div key={tool.id} className={`ai-tool-card ${activeTool === tool.id ? 'active' : ''}`}
            style={activeTool === tool.id ? { borderColor: 'var(--accent)', background: 'var(--accent-light)' } : {}}
            onClick={() => setActiveTool(tool.id)}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><tool.icon size={16} color="var(--accent)" /> {tool.label}</h3>
            <p>{tool.desc}</p>
          </div>
        ))}
      </div>

      <div className="chat-layout">
        <div className="conv-sidebar">
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => { setActiveConv(null); setMessages([]); }}>
            <FiPlus size={14} /> New Chat
          </button>
          {conversations.map(conv => (
            <div key={conv.id} className={`conv-item ${activeConv?.id === conv.id ? 'active' : ''}`} onClick={() => loadConversation(conv)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="conv-item-title">{conv.title || 'Untitled'}</div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 2, cursor: 'pointer' }}
                  onClick={(e) => deleteConversation(conv.id, e)}><FiTrash2 size={12} /></button>
              </div>
              <div className="conv-item-meta">{new Date(conv.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><FiFilm size={48} /></div>
                <div className="empty-state-text">AI Video Assistant</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                  Select a tool above and start creating
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {['A golden sunset over calm ocean waves', 'Generate a 5-scene product launch storyboard',
                    'Analyze: cinematic drone shot of mountains', 'Create a cyberpunk city night scene'
                  ].map((q, i) => (
                    <button key={i} className="btn btn-secondary btn-sm" onClick={() => setInput(q)}>
                      {q.substring(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="chat-message">
                <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'user' ? 'U' : 'AI'}
                </div>
                <div style={{ flex: 1 }}>
                  {msg.role === 'assistant' ? (
                    <div className="ai-response">
                      {(msg.model || msg.tool) && (
                        <div className="ai-response-header">
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiCpu size={12} /> {msg.model || 'AI'}
                          </span>
                          {msg.tool && <span className="badge badge-info">{msg.tool}</span>}
                        </div>
                      )}
                      <div className="ai-response-body">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.usage && (
                        <div className="ai-usage">
                          <span>Prompt: {msg.usage.prompt_tokens} tokens</span>
                          <span>Completion: {msg.usage.completion_tokens} tokens</span>
                          <span>Total: {msg.usage.total_tokens} tokens</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="chat-bubble user">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message">
                <div className="chat-avatar ai">AI</div>
                <div className="chat-bubble"><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Generating...</span>
                </div></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={placeholders[activeTool]} disabled={loading} />
            <button className="chat-send" onClick={handleSend} disabled={loading || !input.trim()}>
              <FiSend size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
