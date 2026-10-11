import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Upload, 
  Sparkles, 
  Download, 
  Play, 
  Pause, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Sliders,
  Film
} from 'lucide-react';
import { getApiUrl } from '../config';

export default function VideoEnhancer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState('opencv'); // Default to opencv or fast_realtime for rapid video throughput on CPU
  const [gamma, setGamma] = useState(1.8);
  const [claheClip, setClaheClip] = useState(2.2);
  const [denoise, setDenoise] = useState(true);

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setJobId(null);
      setJobStatus(null);
      setError(null);
    }
  };

  // Generates a lightweight 3-second dark video on client canvas using MediaRecorder for instant testing
  const generateSampleVideo = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(20);
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'night_surveillance_sample.webm', { type: 'video/webm' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setJobId(null);
      setJobStatus(null);
      setError(null);
    };

    mediaRecorder.start();

    let frame = 0;
    const totalFrames = 60; // 3 seconds at 20fps

    const drawFrame = () => {
      // Dark scene background
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, 480, 320);

      // Night sky and silhouette
      ctx.fillStyle = '#0c1322';
      ctx.fillRect(30, 80, 90, 160);
      ctx.fillRect(150, 60, 120, 180);
      ctx.fillRect(300, 100, 100, 140);

      // Dim windows
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      for (let x = 40; x < 390; x += 40) {
        for (let y = 100; y < 220; y += 35) {
          if ((x + y + frame) % 4 === 0) ctx.fillRect(x, y, 10, 14);
        }
      }

      // Moving dark target across screen
      const posX = (frame * 6) % 460;
      ctx.fillStyle = '#0a1020';
      ctx.fillRect(posX, 240, 36, 40);
      ctx.beginPath();
      ctx.arc(posX + 18, 230, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#080d1a';
      ctx.fill();

      // Timestamp watermark in corner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = '12px monospace';
      ctx.fillText(`CAM_04 NIGHT VISION [TEST] F:${frame}`, 15, 25);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(drawFrame);
      } else {
        mediaRecorder.stop();
      }
    };

    drawFrame();
  };

  const handleStartEnhancement = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setJobStatus(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', mode);
    formData.append('gamma', gamma.toString());
    formData.append('clahe_clip', claheClip.toString());
    formData.append('denoise', denoise.toString());

    try {
      const res = await fetch(getApiUrl('/api/video/enhance'), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to submit video');
      }

      const data = await res.json();
      setJobId(data.job_id);
    } catch (err) {
      setError(err.message || 'Submission error');
      setIsProcessing(false);
    }
  };

  // Poll video status
  useEffect(() => {
    if (!jobId || !isProcessing) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/video/status/${jobId}`));
        if (!res.ok) return;

        const data = await res.json();
        setJobStatus(data);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          setIsProcessing(false);
          clearInterval(pollIntervalRef.current);
          if (data.status === 'failed') {
            setError(data.error || 'Video processing failed.');
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 800);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [jobId, isProcessing]);

  const handleCancelJob = async () => {
    if (!jobId) return;
    try {
      await fetch(getApiUrl(`/api/video/cancel/${jobId}`), { method: 'POST' });
      setIsProcessing(false);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">
          <Film size={30} color="var(--accent-cyan)" /> Video Enhancement Module
        </h1>
        <p className="page-desc">
          Processes low-light surveillance or camera footage frame-by-frame. Reconstructs sharp, contrast-balanced video and preserves original audio with universal browser playback.
        </p>
      </div>

      <div className="grid-2">
        {/* Left Column: Upload & Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} color="var(--accent-cyan)" /> 1. Upload Low-Light Video
            </h3>

            <div
              className="dropzone"
              onClick={() => document.getElementById('videoFileInput').click()}
            >
              <input
                id="videoFileInput"
                type="file"
                accept="video/mp4,video/avi,video/quicktime,video/webm,video/x-matroska"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="dropzone-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                <Video size={28} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>
                {selectedFile ? selectedFile.name : 'Click to select video or drag file here'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Supports MP4, AVI, MOV, WEBM (Processed frame-by-frame)
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  generateSampleVideo();
                }}
              >
                <Sparkles size={14} color="var(--accent-cyan)" /> Generate Low-Light Test Clip
              </button>

              {selectedFile && (
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> Ready ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                </span>
              )}
            </div>
          </div>

          {/* Parameters */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--accent-neon)" /> 2. Processing Parameters
            </h3>

            <div className="form-group">
              <label className="form-label">
                <span>Enhancement Pipeline</span>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {mode === 'zerodce' ? 'PyTorch Deep Learning' : 'OpenCV High Speed'}
                </span>
              </label>
              <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="opencv">Advanced OpenCV (Gamma LUT + LAB CLAHE + Bilateral) [Recommended for Video]</option>
                <option value="zerodce">Zero-DCE Deep Learning (8-Stage DCENet)</option>
                <option value="hybrid">Hybrid Engine (Zero-DCE + CLAHE)</option>
                <option value="fast_realtime">Ultra-Fast Real-Time (Max FPS)</option>
              </select>
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Gamma Illumination Power</span>
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

            <div className="form-group">
              <div className="form-label">
                <span>CLAHE Contrast Clip Limit</span>
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

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Noise Filtering on Frames
                </span>
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)', width: '16px', height: '16px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.85rem' }}
                disabled={!selectedFile || isProcessing}
                onClick={handleStartEnhancement}
              >
                {isProcessing ? (
                  <>
                    <div className="spinner" /> Enhancing Frames...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Process & Reconstruct Video
                  </>
                )}
              </button>

              {isProcessing && (
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.85rem 1.25rem' }}
                  onClick={handleCancelJob}
                >
                  <XCircle size={18} /> Cancel
                </button>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fda4af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Progress & Video Players */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Card */}
          {(isProcessing || jobStatus) && (
            <div className="glass-card" style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <Clock size={18} color="var(--accent-cyan)" />
                  <span>Processing Progress</span>
                </div>
                <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
                  {jobStatus?.status || 'Processing'}
                </span>
              </div>

              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${jobStatus?.progress_percent || 0}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #00ffaa)'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                <span>{jobStatus?.progress_percent || 0}% Completed</span>
                <span>Frame {jobStatus?.current_frame || 0} / {jobStatus?.total_frames || '?'}</span>
              </div>

              <div className="grid-3" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Throughput</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {jobStatus?.processing_fps || 0} FPS
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elapsed Time</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {jobStatus?.elapsed_time || 0}s
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Remaining</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-neon)' }}>
                    {jobStatus?.remaining_time || 0}s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Comparison */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={18} color="var(--accent-cyan)" /> 3. Video Playback & Inspection
              </h3>

              {jobStatus?.status === 'completed' && jobStatus?.enhanced_url && (
                <a
                  href={`${getApiUrl(jobStatus.enhanced_url)}?download=true`}
                  download
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <Download size={14} /> Download Enhanced Video
                </a>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Enhanced Video (when completed) */}
              {jobStatus?.status === 'completed' && jobStatus?.enhanced_url ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-neon)' }}>
                      Night Vision Enhanced Video (H.264 Audio Preserved)
                    </span>
                    <span className="badge badge-success">Completed 100%</span>
                  </div>
                  <div className="video-wrapper">
                    <video
                      controls
                      autoPlay
                      loop
                      playsInline
                      src={getApiUrl(jobStatus.enhanced_url)}
                    />
                  </div>
                </div>
              ) : null}

              {/* Original Video Preview */}
              {previewUrl ? (
                <div>
                  <div style={{ marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Original Input Video
                  </div>
                  <div className="video-wrapper">
                    <video
                      controls
                      loop
                      playsInline
                      src={previewUrl}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <Video size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                  <div>Upload a video or generate the sample clip to begin</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
