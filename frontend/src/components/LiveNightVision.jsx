import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Sliders, 
  Sparkles, 
  Download, 
  Activity, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Eye
} from 'lucide-react';

export default function LiveNightVision() {
  const [streamActive, setStreamActive] = useState(false);
  const [feedSource, setFeedSource] = useState('browser'); // 'browser' or 'server_mjpeg'
  const [mode, setMode] = useState('fast_realtime');
  const [gamma, setGamma] = useState(1.6);
  const [claheClip, setClaheClip] = useState(2.0);
  const [denoise, setDenoise] = useState(true);

  // Live Metrics
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [boostPercent, setBoostPercent] = useState(0);
  const [origLuminance, setOrigLuminance] = useState(0);
  const [enhLuminance, setEnhLuminance] = useState(0);
  const [error, setError] = useState(null);

  // Snapshot
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  const videoRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const enhancedCanvasRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const isStreamingRef = useRef(false);
  const frameCountRef = useRef(0);
  const lastFpsTimeRef = useRef(Date.now());
  const isProcessingFrameRef = useRef(false);

  // Start Camera
  const startCamera = async () => {
    setError(null);
    if (feedSource === 'server_mjpeg') {
      setStreamActive(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreamActive(true);
          isStreamingRef.current = true;
          startProcessingLoop();
        };
      }
    } catch (err) {
      console.error(err);
      setError(`Unable to access webcam: ${err.message}. Ensure camera permissions are granted, or switch to Simulated/Server stream mode.`);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    isStreamingRef.current = false;
    setStreamActive(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Continuous frame processing loop
  const startProcessingLoop = () => {
    const processFrame = async () => {
      if (!isStreamingRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState >= 2 && !isProcessingFrameRef.current) {
        isProcessingFrameRef.current = true;

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;

        // Render to original canvas
        if (originalCanvasRef.current) {
          const origCtx = originalCanvasRef.current.getContext('2d');
          if (originalCanvasRef.current.width !== w) originalCanvasRef.current.width = w;
          if (originalCanvasRef.current.height !== h) originalCanvasRef.current.height = h;
          origCtx.drawImage(video, 0, 0, w, h);
        }

        // Capture frame to temporary canvas
        if (!captureCanvasRef.current) {
          captureCanvasRef.current = document.createElement('canvas');
        }
        const capCanvas = captureCanvasRef.current;
        if (capCanvas.width !== w) capCanvas.width = w;
        if (capCanvas.height !== h) capCanvas.height = h;
        const capCtx = capCanvas.getContext('2d');
        capCtx.drawImage(video, 0, 0, w, h);

        const base64Data = capCanvas.toDataURL('image/jpeg', 0.65);

        try {
          const res = await fetch('/api/live/process_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              frame: base64Data,
              mode: mode,
              gamma: gamma,
              clahe_clip: claheClip,
              denoise: denoise
            })
          });

          if (res.ok) {
            const data = await res.json();
            setLatencyMs(data.inference_time_ms);
            setOrigLuminance(data.original_luminance);
            setEnhLuminance(data.enhanced_luminance);
            setBoostPercent(data.boost_percent);

            // Draw enhanced frame
            const img = new Image();
            img.onload = () => {
              if (enhancedCanvasRef.current) {
                const enhCtx = enhancedCanvasRef.current.getContext('2d');
                if (enhancedCanvasRef.current.width !== w) enhancedCanvasRef.current.width = w;
                if (enhancedCanvasRef.current.height !== h) enhancedCanvasRef.current.height = h;
                enhCtx.drawImage(img, 0, 0, w, h);

                // Night Vision Tactical Reticle overlay
                enhCtx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
                enhCtx.lineWidth = 1;
                // Center crosshair
                const cx = w / 2;
                const cy = h / 2;
                enhCtx.beginPath();
                enhCtx.moveTo(cx - 20, cy);
                enhCtx.lineTo(cx + 20, cy);
                enhCtx.moveTo(cx, cy - 20);
                enhCtx.lineTo(cx, cy + 20);
                enhCtx.stroke();

                // Corner brackets
                const b = 25;
                enhCtx.strokeRect(20, 20, b, b);
                enhCtx.strokeRect(w - 20 - b, 20, b, b);
                enhCtx.strokeRect(20, h - 20 - b, b, b);
                enhCtx.strokeRect(w - 20 - b, h - 20 - b, b, b);
              }
            };
            img.src = data.enhanced_frame;
          }
        } catch (e) {
          console.error("Frame processing error:", e);
        } finally {
          isProcessingFrameRef.current = false;
        }

        // FPS calculation
        frameCountRef.current++;
        const now = Date.now();
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }
      }

      if (isStreamingRef.current) {
        requestAnimationFrame(processFrame);
      }
    };

    requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Capture snapshot of current enhanced frame
  const takeSnapshot = () => {
    if (enhancedCanvasRef.current) {
      const dataUrl = enhancedCanvasRef.current.toDataURL('image/jpeg', 0.95);
      setSnapshotUrl(dataUrl);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">
          <Camera size={30} color="var(--accent-amber)" /> Live Night Vision Feed
        </h1>
        <p className="page-desc">
          Real-time low-light camera feed with dynamic brightness amplification, LAB-space CLAHE micro-contrast, and tactical night vision HUD.
        </p>
      </div>

      {/* Hidden HTML5 video element for camera stream */}
      <video ref={videoRef} playsInline muted style={{ display: 'none' }} />

      <div className="grid-2">
        {/* Left Column: Feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Enhanced Canvas View */}
          <div className="glass-card" style={{ padding: '1rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <span className="status-dot" style={{ background: streamActive ? '#00ffaa' : '#64748b' }} />
                <span>Night Vision Enhanced View</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className="badge badge-success">
                  <Activity size={12} /> {fps} FPS
                </span>
                <span className="badge badge-warning">
                  {latencyMs} ms
                </span>
              </div>
            </div>

            <div style={{ position: 'relative', width: '100%', minHeight: '360px', background: '#020408', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {feedSource === 'server_mjpeg' && streamActive ? (
                <img
                  src={`/api/live/stream?mode=${mode}&gamma=${gamma}&clahe_clip=${claheClip}`}
                  alt="Server MJPEG Stream"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <canvas
                  ref={enhancedCanvasRef}
                  style={{ width: '100%', height: 'auto', display: streamActive ? 'block' : 'none' }}
                />
              )}

              {!streamActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <CameraOff size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <div>Camera stream is currently stopped</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "Start Live Night Vision" below</div>
                </div>
              )}

              {/* Tactical Night Vision HUD Overlay */}
              {streamActive && (
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', right: '0.75rem', display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-neon)', textShadow: '0 0 5px rgba(0,255,170,0.8)' }}>
                  <span>MODE: {mode.toUpperCase()} // GAMMA: {gamma}</span>
                  <span>ILLUM BOOST: +{boostPercent}%</span>
                  <span>LUM: {enhLuminance}/255</span>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Original View */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Raw Camera Feed (Before Enhancement)
            </div>
            <div style={{ width: '100%', minHeight: '200px', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas
                ref={originalCanvasRef}
                style={{ width: '100%', height: 'auto', display: streamActive ? 'block' : 'none' }}
              />
              {!streamActive && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Original feed offline</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Controls Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--accent-amber)" /> Live Camera Controls
            </h3>

            {/* Camera Toggle Button */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {!streamActive ? (
                <button className="btn btn-primary" style={{ flex: 1, padding: '0.85rem' }} onClick={startCamera}>
                  <Camera size={18} /> Start Live Night Vision
                </button>
              ) : (
                <button className="btn btn-danger" style={{ flex: 1, padding: '0.85rem' }} onClick={stopCamera}>
                  <CameraOff size={18} /> Stop Camera Feed
                </button>
              )}

              <button
                className="btn btn-secondary"
                disabled={!streamActive}
                style={{ padding: '0.85rem 1.25rem' }}
                onClick={takeSnapshot}
              >
                <Download size={18} /> Snapshot
              </button>
            </div>

            {/* Feed Source */}
            <div className="form-group">
              <label className="form-label">
                <span>Camera Stream Source</span>
              </label>
              <select 
                className="form-select" 
                value={feedSource} 
                onChange={(e) => {
                  stopCamera();
                  setFeedSource(e.target.value);
                }}
              >
                <option value="browser">Browser Webcam (Recommended - Universal Client-Side)</option>
                <option value="server_mjpeg">Server Hardware Camera (OpenCV Device 0)</option>
              </select>
            </div>

            {/* Enhancement Mode */}
            <div className="form-group">
              <label className="form-label">
                <span>Enhancement Algorithm</span>
                <span style={{ color: 'var(--accent-neon)', fontFamily: 'var(--font-mono)' }}>
                  {mode === 'fast_realtime' ? 'Ultra-Fast 30+ FPS' : 'Neural Curve'}
                </span>
              </label>
              <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="fast_realtime">Fast Real-Time (OpenCV LUT Gamma + CLAHE) [30+ FPS]</option>
                <option value="opencv">Advanced OpenCV (Gamma + LAB CLAHE + Bilateral)</option>
                <option value="zerodce">Zero-DCE Deep Learning (GPU Recommended)</option>
                <option value="hybrid">Hybrid Engine (Zero-DCE + CLAHE)</option>
              </select>
            </div>

            {/* Gamma Slider */}
            <div className="form-group">
              <div className="form-label">
                <span>Gamma Amplification (γ)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{gamma.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="1.0"
                max="2.4"
                step="0.1"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
              />
            </div>

            {/* CLAHE Clip Limit */}
            <div className="form-group">
              <div className="form-label">
                <span>CLAHE Clip Limit</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{claheClip.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="1.0"
                max="3.5"
                step="0.2"
                value={claheClip}
                onChange={(e) => setClaheClip(parseFloat(e.target.value))}
              />
            </div>

            {/* Denoise Checkbox */}
            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Edge-Preserving Denoising
                </span>
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  style={{ accentColor: 'var(--accent-neon)', width: '16px', height: '16px' }}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fda4af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}
          </div>

          {/* Live Illumination Diagnostics Card */}
          <div className="glass-card">
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-neon)" /> Real-Time Illumination Gauge
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  <span>Raw Sensor Luminance:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#fb7185' }}>{origLuminance} / 255</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${(origLuminance / 255) * 100}%`, background: '#f43f5e' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>
                  <span>Enhanced Night Vision Luminance:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>{enhLuminance} / 255</span>
                </div>
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar-fill" style={{ width: `${(enhLuminance / 255) * 100}%`, background: '#10b981' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Net Illumination Gain:</span>
                <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                  +{boostPercent}% Brightness
                </span>
              </div>
            </div>
          </div>

          {/* Snapshot Preview Card */}
          {snapshotUrl && (
            <div className="glass-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-neon)' }}>
                  Captured Night Vision Snapshot
                </span>
                <a
                  href={snapshotUrl}
                  download={`night_vision_snapshot_${Date.now()}.jpg`}
                  className="btn btn-primary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Save JPG
                </a>
              </div>
              <img src={snapshotUrl} alt="Snapshot" style={{ width: '100%', borderRadius: 'var(--radius-sm)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
