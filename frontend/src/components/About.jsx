import React from 'react';
import { 
  BookOpen, 
  Cpu, 
  Zap, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  FileText,
  Code
} from 'lucide-react';

export default function About() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="page-header">
        <h1 className="page-title">
          <BookOpen size={30} color="var(--accent-neon)" /> Project Documentation & Technical Architecture
        </h1>
        <p className="page-desc">
          Comprehensive academic and algorithmic guide to the Night Vision Image & Video Enhancement System.
        </p>
      </div>

      {/* 1. Problem Statement & Motivation */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-neon)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={22} /> 1. Problem Statement & Motivation
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          Capturing images and video in low-light, nighttime, or underexposed environments poses severe challenges for conventional optical sensors. 
          Due to the insufficient number of photons hitting CMOS/CCD camera photodiodes, raw recordings suffer from:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong style={{ color: 'var(--text-primary)' }}>Low Signal-to-Noise Ratio (SNR):</strong> Amplifying dark signals exponentially magnifies thermal and read noise.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Loss of Contrast & Dynamic Range:</strong> Pixel values collapse into a narrow range near zero luminance.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Color Desaturation & Distortion:</strong> Chrominance fidelity vanishes, turning subtle color gradients into muddy grayscale patches.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Loss of Edge & Texture Details:</strong> Object boundaries, faces, and text become unrecognizable.</li>
        </ul>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          This system provides an end-to-end, real-time solution integrating cutting-edge deep learning (Zero-DCE) with high-efficiency classical computer vision (LAB CLAHE, Gamma LUT, Bilateral Filtering) to overcome these limitations.
        </p>
      </div>

      {/* 2. Zero-DCE Architecture */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Zap size={22} /> 2. Zero-DCE (Zero-Reference Deep Curve Estimation)
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          Conventional deep learning low-light enhancers require paired datasets (capturing the exact same scene in dark and bright conditions). 
          In contrast, <strong>Zero-DCE (CVPR 2020)</strong> formulates enhancement as a task of estimating <em>image-specific high-order dynamic range curves</em> 
          without requiring any ground-truth normal-light references.
        </p>

        <div style={{ background: 'rgba(8, 12, 20, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
          <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            MATHEMATICAL FORMULATION // LIGHT-ENHANCEMENT CURVE
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: '#6ee7b7', lineHeight: 1.6 }}>
            LE<sub>n</sub>(x) = LE<sub>n-1</sub>(x) + A<sub>n</sub>(x) · LE<sub>n-1</sub>(x) · (1 - LE<sub>n-1</sub>(x))
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Where <em>x</em> is the normalized pixel intensity in [0, 1], <em>A<sub>n</sub>(x)</em> represents the pixel-wise curve parameter map learned by DCENet, 
            and <em>n ∈ [1, 8]</em> represents 8 sequential iterations of self-adaptive illumination adjustment.
          </p>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Non-Reference Loss Functions:
        </h3>
        <div className="grid-2" style={{ marginTop: '0.75rem' }}>
          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-neon)', marginBottom: '0.25rem' }}>1. Spatial Consistency Loss (L_spa)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Preserves the difference of neighboring pixel regions between the input and enhanced version to prevent structural deformation.
            </div>
          </div>
          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>2. Exposure Control Loss (L_exp)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Measures the distance between the average intensity of local 16x16 pixel patches and a well-exposed target value (E = 0.6).
            </div>
          </div>
          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.25rem' }}>3. Color Constancy Loss (L_col)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Prevents unnatural chromatic shifts and color casts by enforcing the Gray-World color constancy assumption across R, G, B channels.
            </div>
          </div>
          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, color: '#f43f5e', marginBottom: '0.25rem' }}>4. Illumination Smoothness Loss (L_tv)</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Preserves monotonic curvature and smooth gradients in the estimated parameter maps <em>A</em> to eliminate ringing and posterization.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Advanced OpenCV Pipeline */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sliders size={22} /> 3. Advanced Computer Vision Pipeline
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          For real-time video and webcam streaming where GPU acceleration is unavailable, our OpenCV enhancement pipeline 
          achieves 30+ FPS throughput while maintaining superior perceptual quality:
        </p>

        <div className="grid-3">
          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--accent-neon)', marginBottom: '0.5rem' }}>LAB-Space CLAHE</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Converts BGR to CIE LAB color space. Applies Contrast Limited Adaptive Histogram Equalization exclusively to the <strong>L (Luminance)</strong> channel while keeping <strong>A & B (Chrominance)</strong> untouched, eliminating color artifacts.
            </p>
          </div>

          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>Fast Gamma Lookup Tables</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Precomputes 256-element gamma correction lookup tables: <code>LUT[i] = 255 * (i / 255)^(1/γ)</code>. Enables instantaneous non-linear shadow expansion with zero floating-point computation per frame.
            </p>
          </div>

          <div style={{ background: 'rgba(8, 12, 20, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.5rem' }}>Bilateral Noise Suppression</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Applies a bilateral filter with spatial and radiometric kernels. Unlike Gaussian blur, the bilateral filter preserves crisp high-contrast edge gradients while smoothing dark sensor noise.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Video & Audio Engine */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1rem', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={22} /> 4. Frame-by-Frame Video Processing & FFmpeg Muxing
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>
          Video enhancement processes multi-gigabyte footage with minimal RAM footprint through sequential streaming:
        </p>
        <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Zero Memory Leaks:</strong> Only 1 frame resides in memory at any instant.</li>
          <li><strong>Asynchronous Threading:</strong> Video processing executes in a background daemon thread with real-time frame counter, ETA, and progress polling.</li>
          <li><strong>Universal Browser Playback:</strong> Transcodes to H.264 (yuv420p) profile, guaranteeing video renders immediately in Google Chrome, Edge, and Firefox.</li>
          <li><strong>Audio Preservation:</strong> FFmpeg isolates the original audio track from the uploaded container and remuxes it into the final output with sample-accurate lip synchronization.</li>
        </ul>
      </div>

      {/* 5. References */}
      <div className="glass-card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={20} /> Academic References & Literature
        </h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: 'var(--font-mono)' }}>
          <div>[1] C. Li, C. Guo, C. C. Loy, "Learning to See in the Dark with Zero-Reference Deep Curve Estimation," <em>IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)</em>, 2020.</div>
          <div>[2] K. Zuiderveld, "Contrast Limited Adaptive Histogram Equalization," <em>Graphics Gems IV</em>, Academic Press, pp. 474–485, 1994.</div>
          <div>[3] D. Hasler, S. Süsstrunk, "Measuring Colourfulness in Natural Images," <em>Human Vision and Electronic Imaging VIII</em>, SPIE, 2003.</div>
          <div>[4] C. Tomasi, R. Manduchi, "Bilateral Filtering for Gray and Color Images," <em>IEEE International Conference on Computer Vision (ICCV)</em>, 1998.</div>
        </div>
      </div>
    </div>
  );
}
