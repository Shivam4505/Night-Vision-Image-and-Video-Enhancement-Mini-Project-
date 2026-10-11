import React, { useState } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Zap, 
  Layers,
  Clock,
  Maximize2
} from 'lucide-react';
import CompareSlider from './CompareSlider';
import { getApiUrl } from '../config';

export default function ImageEnhancer() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState('zerodce');
  const [gamma, setGamma] = useState(1.8);
  const [claheClip, setClaheClip] = useState(2.5);
  const [denoise, setDenoise] = useState(true);
  const [denoiseStrength, setDenoiseStrength] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // Generate a procedural low-light night test sample directly in canvas for instant demonstration!
  const loadSampleImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    // Create a dark nighttime street scene simulation
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, 640, 420);

    // Dark sky gradient with stars
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 260);
    skyGrad.addColorStop(0, '#040710');
    skyGrad.addColorStop(1, '#0a1020');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 640, 260);

    // Distant dark buildings
    ctx.fillStyle = '#0d1528';
    ctx.fillRect(40, 100, 90, 160);
    ctx.fillRect(160, 80, 110, 180);
    ctx.fillRect(300, 120, 80, 140);
    ctx.fillRect(410, 70, 120, 190);
    ctx.fillRect(550, 110, 80, 150);

    // Dim building window lights (underexposed)
    ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
    for (let bx = 55; bx < 620; bx += 35) {
      for (let by = 130; by < 240; by += 28) {
        if ((bx + by) % 3 === 0) ctx.fillRect(bx, by, 8, 12);
      }
    }

    // Dark ground / street
    ctx.fillStyle = '#05080f';
    ctx.fillRect(0, 260, 640, 160);

    // Dim street lamp casting faint light
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(480, 280);
    ctx.lineTo(480, 160);
    ctx.lineTo(460, 150);
    ctx.stroke();

    // Dim cone of illumination
    const coneGrad = ctx.createRadialGradient(460, 155, 5, 460, 240, 110);
    coneGrad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
    coneGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.12)');
    coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.arc(460, 200, 100, 0, Math.PI * 2);
    ctx.fill();

    // Dark car / vehicle silhouette
    ctx.fillStyle = '#080d19';
    ctx.fillRect(180, 270, 160, 45);
    ctx.beginPath();
    ctx.arc(215, 315, 14, 0, Math.PI * 2);
    ctx.arc(305, 315, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#03050a';
    ctx.fill();

    // Subtle sensor noise
    const imgData = ctx.getImageData(0, 0, 640, 420);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 16;
      imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + noise));
      imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + noise));
      imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], 'night_street_lowlight_sample.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(blob));
      setResult(null);
      setError(null);
    }, 'image/jpeg', 0.9);
  };

  const handleEnhance = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', mode);
    formData.append('gamma', gamma.toString());
    formData.append('clahe_clip', claheClip.toString());
    formData.append('denoise', denoise.toString());
    formData.append('denoise_strength', denoiseStrength.toString());

    try {
      const res = await fetch(getApiUrl('/api/image/enhance'), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Enhancement failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to enhance image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">
          <ImageIcon size={30} color="var(--accent-neon)" /> Image Enhancement Module
        </h1>
        <p className="page-desc">
          Upload dark or underexposed photos. The system analyzes illumination deficiencies and restores vibrant visibility, contrast, and fine textures.
        </p>
      </div>

      <div className="grid-2">
        {/* Left Column: Upload and Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upload Dropzone */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Upload size={18} color="var(--accent-neon)" /> 1. Upload Low-Light Image
            </h3>

            <div
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('imageFileInput').click()}
            >
              <input
                id="imageFileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/bmp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="dropzone-icon">
                <Upload size={28} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>
                {selectedFile ? selectedFile.name : 'Click or Drag & Drop low-light photo'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Supports JPG, PNG, WEBP up to 50MB
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  loadSampleImage();
                }}
              >
                <Sparkles size={14} color="var(--accent-neon)" /> Load Low-Light Sample Image
              </button>

              {selectedFile && (
                <span className="badge badge-success">
                  <CheckCircle2 size={13} /> Ready ({Math.round(selectedFile.size / 1024)} KB)
                </span>
              )}
            </div>
          </div>

          {/* Enhancement Configuration */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="var(--accent-cyan)" /> 2. Enhancement Algorithm & Parameters
            </h3>

            {/* Mode Selector */}
            <div className="form-group">
              <label className="form-label">
                <span>Enhancement Pipeline</span>
                <span style={{ color: 'var(--accent-neon)', fontFamily: 'var(--font-mono)' }}>
                  {mode === 'zerodce' ? 'Deep Learning' : mode === 'hybrid' ? 'Neural + CV' : 'Classical CV'}
                </span>
              </label>
              <select 
                className="form-select" 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="zerodce">Zero-DCE Deep Learning (8-Stage DCENet Curves)</option>
                <option value="hybrid">Hybrid Engine (Zero-DCE + LAB CLAHE + Bilateral)</option>
                <option value="opencv">Advanced OpenCV (Gamma LUT + LAB CLAHE + Unsharp)</option>
                <option value="fast_realtime">Fast Real-Time (Low Latency CLAHE)</option>
              </select>
            </div>

            {/* Gamma Slider */}
            <div className="form-group">
              <div className="form-label">
                <span>Gamma Correction Power (γ)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{gamma.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="1.0"
                max="2.6"
                step="0.1"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
              />
            </div>

            {/* CLAHE Clip Limit Slider */}
            <div className="form-group">
              <div className="form-label">
                <span>CLAHE Local Contrast Clip Limit</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{claheClip.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="1.0"
                max="4.0"
                step="0.2"
                value={claheClip}
                onChange={(e) => setClaheClip(parseFloat(e.target.value))}
              />
            </div>

            {/* Denoise Toggle and Strength */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Edge-Preserving Bilateral Denoising
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={denoise}
                    onChange={(e) => setDenoise(e.target.checked)}
                    style={{ accentColor: 'var(--accent-emerald)', width: '16px', height: '16px' }}
                  />
                </label>
              </div>

              {denoise && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div className="form-label">
                    <span>Noise Suppression Strength</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(denoiseStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={denoiseStrength}
                    onChange={(e) => setDenoiseStrength(parseFloat(e.target.value))}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={!selectedFile || loading}
              onClick={handleEnhance}
            >
              {loading ? (
                <>
                  <div className="spinner" /> Enhancing Image with {mode.toUpperCase()}...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Apply Night Vision Enhancement
                </>
              )}
            </button>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fda4af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comparison & Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--accent-neon)" /> 3. Visual Comparison & Inspection
              </h3>

              {result && (
                <a
                  href={`${getApiUrl(result.enhanced_url)}?download=true`}
                  download
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <Download size={14} /> Download Enhanced
                </a>
              )}
            </div>

            {result ? (
              <CompareSlider
                originalUrl={getApiUrl(result.original_url)}
                enhancedUrl={getApiUrl(result.enhanced_url)}
                originalLabel="Low-Light Original"
                enhancedLabel={`Enhanced (${result.mode_used.toUpperCase()})`}
              />
            ) : previewUrl ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: '480px', objectFit: 'contain', display: 'block' }}
                />
                <span className="compare-label compare-label-before">Original Image Loaded</span>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '3rem' }}>
                <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <div>Upload an image or load the sample above to inspect results</div>
              </div>
            )}
          </div>

          {/* Quantitative Analysis & Low-Light Metrics Card */}
          {result && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} color="var(--accent-neon)" /> Objective Illumination & Quality Metrics
                </h4>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-success">
                    <Clock size={12} /> {result.inference_time_ms} ms
                  </span>
                  <span className="badge badge-dark">
                    {result.original_metrics?.lighting_status}
                  </span>
                </div>
              </div>

              {/* Metrics Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Quality Metric</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Original (Low-Light)</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Enhanced</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Mean Brightness (0-255)</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                        {result.original_metrics?.mean_brightness}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
                        {result.enhanced_metrics?.mean_brightness}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-neon)', fontWeight: 600 }}>
                        +{Math.round(((result.enhanced_metrics?.mean_brightness - result.original_metrics?.mean_brightness) / Math.max(1, result.original_metrics?.mean_brightness)) * 100)}%
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>RMS Contrast (Std Dev)</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                        {result.original_metrics?.contrast_rms}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
                        {result.enhanced_metrics?.contrast_rms}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {result.enhanced_metrics?.contrast_rms > result.original_metrics?.contrast_rms ? 'Expanded' : 'Smoothed'}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Dynamic Range (p95 - p5)</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                        {result.original_metrics?.dynamic_range}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
                        {result.enhanced_metrics?.dynamic_range}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-neon)' }}>
                        +{Math.round(result.enhanced_metrics?.dynamic_range - result.original_metrics?.dynamic_range)} pts
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>Shannon Entropy (Detail)</td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                        {result.original_metrics?.entropy}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: '#6ee7b7' }}>
                        {result.enhanced_metrics?.entropy}
                      </td>
                      <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-neon)' }}>
                        +{((result.enhanced_metrics?.entropy - result.original_metrics?.entropy) / Math.max(0.1, result.original_metrics?.entropy) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
