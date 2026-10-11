import React from 'react';
import { 
  Eye, 
  Image, 
  Video, 
  Camera, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Layers, 
  Sliders, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export default function Dashboard({ systemStatus, onNavigate }) {
  const isOnline = systemStatus?.status === 'online';
  const hasModel = systemStatus?.model_loaded;
  const device = systemStatus?.device_name || 'Detecting...';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner */}
      <div 
        className="glass-card" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 78, 59, 0.4) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '780px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <span className="badge badge-success">
              <Sparkles size={13} /> FINAL YEAR / CAPSTONE IVP PROJECT
            </span>
            <span className="badge badge-warning">
              <Zap size={13} /> ZERO-DCE + OPENCV CLAHE
            </span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1rem' }}>
            Night Vision Image & Video Enhancement System
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            An advanced dual-mode computer vision and deep learning system engineered to restore low-light imagery, 
            amplify hidden details in darkness, suppress sensor noise, and reconstruct video streams frame-by-frame with preserved audio.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('image')}>
              <Image size={18} /> Enhance Image <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('video')}>
              <Video size={18} /> Enhance Video
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('live')}>
              <Camera size={18} /> Live Night Vision
            </button>
          </div>
        </div>

        {/* Decorative tactical background grid/glow */}
        <div 
          style={{
            position: 'absolute',
            right: '-60px',
            top: '-60px',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* System Hardware & Status Overview */}
      <div className="grid-4">
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Backend Engine</span>
            <Activity size={18} color="var(--accent-neon)" />
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="status-dot" style={{ background: isOnline ? '#00ffaa' : '#f43f5e' }} />
            {isOnline ? 'FastAPI Online' : 'Connecting...'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Port 8000 // High Performance Async
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Compute Device</span>
            <Cpu size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {device}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            PyTorch {systemStatus?.torch_version || '2.x'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Deep Learning Model</span>
            <Zap size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {hasModel ? 'Zero-DCE Loaded' : 'OpenCV Ready'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Epoch99 Pretrained Snapshots
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Video & Audio Muxer</span>
            <Video size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            FFmpeg H.264
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Universal Browser Playback
          </div>
        </div>
      </div>

      {/* Feature Modules Cards */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Layers size={22} color="var(--accent-neon)" /> Core Project Modules
      </h2>

      <div className="grid-3">
        {/* Module 1: Image Enhancement */}
        <div 
          className="glass-card" 
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onClick={() => onNavigate('image')}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-neon)', marginBottom: '1.25rem' }}>
            <Image size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            1. Image Enhancement
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Upload low-light photographs (JPG, PNG, WEBP). Automatically measures mean luminance, evaluates dark underexposure severity, and reveals occluded night details with side-by-side comparison slider and download.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-neon)', fontSize: '0.88rem', fontWeight: 600 }}>
            Open Module <ArrowRight size={15} />
          </div>
        </div>

        {/* Module 2: Video Enhancement */}
        <div 
          className="glass-card" 
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onClick={() => onNavigate('video')}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', marginBottom: '1.25rem' }}>
            <Video size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            2. Video Enhancement
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Process video clips frame-by-frame without excessive RAM footprint. Retains source FPS, eliminates dark sensor noise, tracks real-time progress, and remuxes original audio tracks using FFmpeg.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.88rem', fontWeight: 600 }}>
            Open Module <ArrowRight size={15} />
          </div>
        </div>

        {/* Module 3: Live Night Vision */}
        <div 
          className="glass-card" 
          style={{ cursor: 'pointer', transition: 'all 0.25s ease' }}
          onClick={() => onNavigate('live')}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)', marginBottom: '1.25rem' }}>
            <Camera size={24} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            3. Live Night Vision
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Stream webcam feeds in real-time. Features ultra-fast OpenCV LUT gamma + LAB CLAHE pipeline delivering 30+ FPS, real-time luminance boost gauge, and one-click snapshot capture.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-amber)', fontSize: '0.88rem', fontWeight: 600 }}>
            Open Module <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Technical Workflow Overview */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sliders size={20} color="var(--accent-neon)" /> Image & Video Enhancement Pipeline
        </h3>
        
        <div className="grid-4" style={{ position: 'relative' }}>
          <div style={{ background: 'rgba(8, 12, 20, 0.7)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-neon)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>STEP 01</div>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Luminance Analysis</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Computes Y/L-channel mean, RMS contrast, and dynamic range to quantify darkness severity.
            </div>
          </div>

          <div style={{ background: 'rgba(8, 12, 20, 0.7)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>STEP 02</div>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Curve Estimation</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Zero-DCE DCENet generates 24 pixel-wise dynamic range curve parameter maps across 8 iterations.
            </div>
          </div>

          <div style={{ background: 'rgba(8, 12, 20, 0.7)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>STEP 03</div>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>LAB CLAHE & Denoise</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Adaptive histogram equalization in LAB space and bilateral filtering to eliminate sensor noise.
            </div>
          </div>

          <div style={{ background: 'rgba(8, 12, 20, 0.7)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>STEP 04</div>
            <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>Mux & Validation</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              H.264 MP4 transcoding, FFmpeg audio remuxing, before/after metrics calculation and export.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
