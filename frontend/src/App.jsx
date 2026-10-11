import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Image, 
  Video, 
  Camera, 
  BookOpen, 
  LayoutDashboard,
  Cpu,
  Zap,
  Activity,
  AlertTriangle
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ImageEnhancer from './components/ImageEnhancer';
import VideoEnhancer from './components/VideoEnhancer';
import LiveNightVision from './components/LiveNightVision';
import About from './components/About';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch backend status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setSystemStatus(data);
        } else {
          setSystemStatus({ status: 'offline' });
        }
      } catch (err) {
        setSystemStatus({ status: 'offline' });
      } finally {
        setStatusLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Eye size={22} />
          </div>
          <div>
            <div className="brand-title">LUMINA</div>
            <div className="brand-subtitle">Night Vision System</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            <Image size={16} /> Image
          </button>
          <button
            className={`nav-item ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            <Video size={16} /> Video
          </button>
          <button
            className={`nav-item ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <Camera size={16} /> Live
          </button>
          <button
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <BookOpen size={16} /> About
          </button>
        </nav>

        {/* Status indicator */}
        <div className="nav-status">
          <span 
            className="status-dot" 
            style={{ 
              background: systemStatus?.status === 'online' ? '#00ffaa' : '#f43f5e',
              boxShadow: systemStatus?.status === 'online' ? '0 0 10px #00ffaa' : '0 0 10px #f43f5e'
            }} 
          />
          <span>
            {statusLoading ? 'Checking...' : systemStatus?.status === 'online' ? (
              systemStatus.cuda_available ? 'CUDA / GPU' : 'CPU Active'
            ) : 'Backend Offline'}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {systemStatus?.status === 'offline' && !statusLoading && (
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1.25rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#fda4af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} />
              <span>Backend server is offline or restarting. Run <code>python -m uvicorn backend.main:app --port 8000</code> to activate enhancement pipelines.</span>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard systemStatus={systemStatus} onNavigate={setActiveTab} />
        )}
        {activeTab === 'image' && <ImageEnhancer />}
        {activeTab === 'video' && <VideoEnhancer />}
        {activeTab === 'live' && <LiveNightVision />}
        {activeTab === 'about' && <About />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem 2.5rem', background: 'rgba(8, 12, 20, 0.9)', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <strong style={{ color: 'var(--text-secondary)' }}>Night Vision Image & Video Enhancement System</strong> — College IVP Capstone Project
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)' }}>
          <span>Zero-DCE (PyTorch)</span>
          <span>OpenCV 4.x</span>
          <span>FFmpeg H.264</span>
        </div>
      </footer>
    </div>
  );
}
