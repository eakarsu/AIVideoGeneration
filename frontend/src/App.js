import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import Text2VideoPage from './pages/Text2VideoPage';
import Img2VideoPage from './pages/Img2VideoPage';
import TemplatesPage from './pages/TemplatesPage';
import StoryboardsPage from './pages/StoryboardsPage';
import ScenesPage from './pages/ScenesPage';
import MediaPage from './pages/MediaPage';
import TransitionsPage from './pages/TransitionsPage';
import AudioPage from './pages/AudioPage';
import StylesPage from './pages/StylesPage';
import RenderQueuePage from './pages/RenderQueuePage';
import ExportsPage from './pages/ExportsPage';
import PromptsPage from './pages/PromptsPage';
import SettingsPage from './pages/SettingsPage';
import AIChatPage from './pages/AIChatPage';

import { FiFilm, FiType, FiImage, FiGrid, FiLayers, FiVideo, FiFolder, FiShuffle, FiMusic, FiDroplet, FiClock, FiDownload, FiEdit3, FiSettings, FiHome, FiLogOut, FiMenu, FiMessageSquare } from 'react-icons/fi';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: FiHome },
  { path: '/projects', label: 'Video Projects', icon: FiFilm },
  { path: '/text2video', label: 'Text to Video', icon: FiType },
  { path: '/img2video', label: 'Image to Video', icon: FiImage },
  { path: '/templates', label: 'Templates', icon: FiGrid },
  { path: '/storyboards', label: 'Storyboards', icon: FiLayers },
  { path: '/scenes', label: 'Scenes', icon: FiVideo },
  { path: '/media', label: 'Media Library', icon: FiFolder },
  { path: '/transitions', label: 'Transitions', icon: FiShuffle },
  { path: '/audio', label: 'Audio Tracks', icon: FiMusic },
  { path: '/styles', label: 'Video Styles', icon: FiDroplet },
  { path: '/renderqueue', label: 'Render Queue', icon: FiClock },
  { path: '/exports', label: 'Export Presets', icon: FiDownload },
  { path: '/prompts', label: 'AI Prompts', icon: FiEdit3 },
  { path: '/ai-chat', label: 'AI Assistant', icon: FiMessageSquare },
  { path: '/settings', label: 'Settings', icon: FiSettings },
];

function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo" onClick={() => setCollapsed(!collapsed)}>
          <FiMenu size={20} />
          {!collapsed && <span className="logo-text">AI Video Studio</span>}
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link key={item.path} to={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} title={item.label}>
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}><FiLogOut size={18} />{!collapsed && <span>Logout</span>}</button>
      </div>
    </div>
  );
}

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>{children}</main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  return localStorage.getItem('token') ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/text2video" element={<ProtectedRoute><Text2VideoPage /></ProtectedRoute>} />
        <Route path="/img2video" element={<ProtectedRoute><Img2VideoPage /></ProtectedRoute>} />
        <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
        <Route path="/storyboards" element={<ProtectedRoute><StoryboardsPage /></ProtectedRoute>} />
        <Route path="/scenes" element={<ProtectedRoute><ScenesPage /></ProtectedRoute>} />
        <Route path="/media" element={<ProtectedRoute><MediaPage /></ProtectedRoute>} />
        <Route path="/transitions" element={<ProtectedRoute><TransitionsPage /></ProtectedRoute>} />
        <Route path="/audio" element={<ProtectedRoute><AudioPage /></ProtectedRoute>} />
        <Route path="/styles" element={<ProtectedRoute><StylesPage /></ProtectedRoute>} />
        <Route path="/renderqueue" element={<ProtectedRoute><RenderQueuePage /></ProtectedRoute>} />
        <Route path="/exports" element={<ProtectedRoute><ExportsPage /></ProtectedRoute>} />
        <Route path="/prompts" element={<ProtectedRoute><PromptsPage /></ProtectedRoute>} />
        <Route path="/ai-chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
