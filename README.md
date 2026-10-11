# LUMINA // Night Vision Image & Video Enhancement System
> **College Capstone / Final-Year Image & Video Processing (IVP) Project**  
> An autonomous, real-time Computer Vision and Deep Learning framework for restoring, analyzing, and enhancing low-light, nighttime, and underexposed imagery and video streams.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Algorithmic Foundations](#-algorithmic-foundations)
   - [Low-Light Enhancement Principles](#1-low-light-enhancement-principles)
   - [Zero-DCE (Zero-Reference Deep Curve Estimation)](#2-zero-dce-deep-curve-estimation)
   - [Frame-by-Frame Video Processing](#3-video-frame-processing--ffmpeg-muxing)
   - [Noise Reduction & Detail Preservation](#4-noise-reduction--edge-preservation)
4. [System Architecture](#-system-architecture)
5. [Tech Stack](#-tech-stack)
6. [Installation & Setup](#-installation--setup)
7. [How to Run](#-how-to-run)
8. [Module Usage Guide](#-module-usage-guide)
9. [Automated Verification Tests](#-automated-verification-tests)
10. [Limitations & Future Scope](#-limitations--future-scope)

---

## 🌟 Project Overview
Under nighttime or severe low-light conditions, optical sensors receive insufficient photons, resulting in dark underexposure, collapsed dynamic range, severe thermal sensor noise, and lost color fidelity. 

The **Night Vision Image & Video Enhancement System** solves this by uniting **Deep Learning (Zero-DCE)** with **High-Speed Classical Computer Vision (OpenCV LAB CLAHE, Gamma LUTs, and Bilateral Filtering)**. It handles static images, multi-gigabyte video files with audio preservation via FFmpeg, and real-time live webcam feeds with a tactical night vision HUD.

---

## 🚀 Key Features

### 1. Image Enhancement
- **Format Support:** JPG, PNG, WEBP, BMP.
- **Low-Light Detection:** Automatically assesses mean luminance, dynamic range, RMS contrast, and Shannon entropy; classifies darkness severity (*Severe Darkness*, *Moderate Low-Light*, *Mild Underexposure*, or *Adequate Lighting*).
- **Multiple Pipeline Modes:**
  - `Zero-DCE`: 8-stage Deep Curve Estimation CNN.
  - `Advanced OpenCV`: Gamma LUT + LAB CLAHE + Bilateral Denoise + Unsharp Mask.
  - `Hybrid`: Combined neural dynamic curves with local micro-contrast enhancement.
  - `Fast Real-Time`: Ultra-low latency pathway.
- **Interactive Before/After Slider:** Draggable split slider with side-by-side mode.
- **Objective Quality Metrics Table:** Compares mean brightness, RMS contrast, dynamic range, and detail entropy before vs. after.
- **One-Click Export:** Download high-resolution enhanced images.

### 2. Video Enhancement
- **Format Support:** MP4, AVI, MOV, WEBM, MKV.
- **Frame-by-Frame Streaming:** Low memory footprint—only 1 frame in RAM at any instant; supports arbitrarily large video files.
- **Real-Time Progress Tracking:** Frame counter, percentage bar, processing speed (FPS), elapsed time, and ETA.
- **Universal Browser Playback:** Transcodes to H.264 (`yuv420p`) profile for direct HTML5 video playback without codec errors.
- **Audio Preservation:** Isolates original audio tracks using FFmpeg and multiplexes them back into the enhanced container.
- **One-Click Export:** Download enhanced video directly from the browser.

### 3. Live Night Vision
- **Dual Stream Modes:**
  - *Browser Client Webcam:* Uses HTML5 `getUserMedia`, processes frames via API, and streams enhanced video at 30+ FPS.
  - *Server Hardware Camera:* Direct OpenCV `cv2.VideoCapture(0)` MJPEG streaming.
- **Real-Time Reticle HUD:** Tactical crosshair, corner target brackets, live FPS counter, latency (ms), and illumination boost gauge.
- **Instant Snapshot Capture:** Grab and download enhanced night vision photos with a single click.

### 4. Educational & College Project Dashboard
- System health diagnostic cards (PyTorch device, CUDA detection, model weight status, FFmpeg binaries).
- Detailed technical documentation explaining the mathematics, loss functions, and architectural decisions.

---

## 🧠 Algorithmic Foundations

### 1. Low-Light Enhancement Principles
Optical sensors capture photon counts governed by the Poisson-Gaussian noise model:
$$I = g \cdot (N_{photon} + N_{thermal}) + N_{read}$$
In low-light scenarios, signal $N_{photon}$ approaches zero while noise $N_{thermal} + N_{read}$ remains constant. Simple linear brightness amplification multiplies the noise, degrading the image. Low-light enhancement requires **non-linear dynamic range expansion**, expanding dark shadow regions while preventing highlight saturation.

### 2. Zero-DCE (Deep Curve Estimation)
Unlike standard deep learning approaches that require paired dark/normal datasets, **Zero-DCE (CVPR 2020)** trains without reference images. It trains a 7-layer symmetrical CNN (*DCENet*) to estimate high-order pixel-wise curve parameter maps $\mathcal{A}$:

$$LE_n(x) = LE_{n-1}(x) + \mathcal{A}_n(x) \cdot LE_{n-1}(x) \cdot (1 - LE_{n-1}(x))$$

Iterated $n=8$ times, this formulation guarantees monotonic lightness adjustment bounded in $[0, 1]$. Training is guided by four zero-reference loss functions:
1. **Spatial Consistency Loss ($\mathcal{L}_{spa}$):** Preserves neighbor gradient differences to retain edges.
2. **Exposure Control Loss ($\mathcal{L}_{exp}$):** Drives local 16×16 patch intensity toward well-exposed target $E=0.6$.
3. **Color Constancy Loss ($\mathcal{L}_{col}$):** Enforces Gray-World assumption to eliminate chromatic casts.
4. **Illumination Smoothness Loss ($\mathcal{L}_{tv}$):** Penalizes abrupt gradient changes in curve maps $\mathcal{A}$.

### 3. Video Frame Processing & FFmpeg Muxing
Loading an entire video into memory causes Out-Of-Memory (OOM) crashes on standard laptops. The system streams video:
1. `cv2.VideoCapture` yields single frames sequentially.
2. The enhancement engine applies curves and filtering in-place.
3. OpenCV writes frames to an intermediate container.
4. Subprocess execution invokes FFmpeg:
   ```bash
   ffmpeg -y -i enhanced_temp.mp4 -i original.mp4 -c:v libx264 -pix_fmt yuv420p -c:a aac -map 0:v:0 -map 1:a:0? final.mp4
   ```
   This ensures standard H.264 decoding in web browsers and seamlessly muxes the source audio track.

### 4. Noise Reduction & Edge Preservation
- **Bilateral Filtering:** Formulated as:
  $$I^{filtered}(x) = \frac{1}{W_p} \sum_{x_i \in \Omega} I(x_i) f_r(\|I(x_i) - I(x)\|) g_s(\|x_i - x\|)$$
  The radiometric kernel $f_r$ prevents smoothing across sharp intensity boundaries (edges), suppressing dark sensor noise while keeping silhouettes sharp.
- **LAB Color Space CLAHE:** Operating exclusively on the **L (Luminance)** channel avoids shifting **A** and **B** chromatic values, eliminating chromatic aberration and preserving natural color temperature.

---

## 🏗️ System Architecture

```
night-vision-system/
├── backend/
│   ├── __init__.py           # Backend package marker
│   ├── main.py               # FastAPI server & REST API endpoints
│   ├── model.py              # Zero-DCE DCENet PyTorch architecture
│   ├── enhancer.py           # Multi-mode enhancement engine (Zero-DCE, OpenCV, Hybrid)
│   ├── video_processor.py    # Sequential video processor with FFmpeg audio muxing
│   └── utils.py              # Luminance metrics, low-light detection, cleanup
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx        # System status & quick access
│   │   │   ├── ImageEnhancer.jsx    # Image upload, metrics table & before/after slider
│   │   │   ├── VideoEnhancer.jsx    # Video frame processing & player
│   │   │   ├── LiveNightVision.jsx  # Real-time webcam streaming & HUD
│   │   │   ├── About.jsx            # Academic documentation & citations
│   │   │   └── CompareSlider.jsx    # Draggable before/after comparison slider
│   │   ├── App.jsx                  # Main navigation & state container
│   │   └── index.css                # Dark tactical cyber theme
│   ├── package.json
│   └── vite.config.js
├── models/
│   └── Epoch99.pth           # Official Zero-DCE pretrained weights
├── uploads/                  # Temporary uploaded files
├── outputs/                  # Processed enhanced results
├── requirements.txt          # Python dependencies
├── test_system.py            # Automated pipeline verification script
├── test_api.py               # Automated HTTP API verification script
├── README.md                 # Complete project documentation
└── .gitignore                # Git ignore configuration
```

---

## 💻 Tech Stack
- **Deep Learning:** PyTorch (Zero-DCE DCENet, CUDA/CPU auto-detection)
- **Computer Vision:** OpenCV 4.x (LAB CLAHE, Gamma LUT, Bilateral Filter, VideoCapture)
- **Audio/Video Encoding:** FFmpeg (via `imageio-ffmpeg`, H.264 & AAC muxing)
- **Backend API:** FastAPI, Uvicorn, Python-Multipart, Pydantic
- **Frontend UI:** React 19, Vite, Lucide Icons, Vanilla CSS (Dark Night-Vision Theme)

---

## 📦 Installation & Setup

### 1. Clone or Open Workspace
```bash
cd "d:/IVP Project"
```

### 2. Install Python Dependencies
```bash
python -m pip install -r requirements.txt
```

### 3. Model Weights
The official Zero-DCE pre-trained weights snapshot (`Epoch99.pth`) is already included in `models/Epoch99.pth`.

---

## 🚀 How to Run

### Single-Command Full-Stack Mode (Recommended)
FastAPI automatically serves both the backend REST API and the built production React frontend:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser.

### Development Mode (Hot-Reload)
To run frontend and backend with hot-reloading:

**Terminal 1 (Backend):**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📖 Module Usage Guide

### 1. Image Enhancement
1. Navigate to the **Image** tab.
2. Drag and drop a dark photograph, or click **"Load Low-Light Sample Image"** for instant demonstration.
3. Select an enhancement pipeline (`Zero-DCE`, `Hybrid`, `Advanced OpenCV`, or `Fast Real-Time`).
4. Adjust sliders for Gamma, CLAHE clip limit, and Denoising if desired.
5. Click **"Apply Night Vision Enhancement"**.
6. Drag the Before/After divider line to inspect restored textures.
7. Click **"Download Enhanced"** to save the result.

### 2. Video Enhancement
1. Navigate to the **Video** tab.
2. Select a video file (MP4, AVI, MOV), or click **"Generate Low-Light Test Clip"** to synthesize a sample video on-the-fly.
3. Click **"Process & Reconstruct Video"**.
4. Observe the frame counter and progress bar.
5. Once completed, compare the original and enhanced videos side-by-side.
6. Click **"Download Enhanced Video"** to save the reconstructed MP4.

### 3. Live Night Vision
1. Navigate to the **Live** tab.
2. Choose **"Browser Webcam"** (works universally on all machines).
3. Click **"Start Live Night Vision"**.
4. The system streams enhanced frames in real time with tactical HUD reticle, FPS counter, and illumination gain metrics.
5. Click **"Snapshot"** to capture and download a frame.

---

## 🧪 Automated Verification Tests
You can verify the backend, algorithms, and endpoints at any time:

```bash
# Test enhancement algorithms, metrics, and video processing
python test_system.py

# Test HTTP API endpoints (Status, Image upload, Live frame processing)
python test_api.py
```

---

## ⚠️ Limitations & Future Scope
- **CPU Inference Speed:** Zero-DCE runs on CPU in ~1.2s per standard resolution image. For real-time 30 FPS video streaming on CPU, the optimized OpenCV pipeline is used. GPU acceleration (CUDA) enables real-time Zero-DCE.
- **Extreme Darkness (< 1 lux):** In pitch-black conditions where sensor readings are purely zero (0 photons), physical thermal IR sensors are required.
- **Future Work:** Integration of temporal consistency networks (Zero-DCE++ for video) and infrared thermal pseudo-coloring.

---

## 👥 Academic Evaluation & Credits
- **Project Title:** Night Vision Image & Video Enhancement System
- **Domain:** Digital Image Processing & Computer Vision (IVP)
- **Reference:** Li et al., *"Learning to See in the Dark with Zero-Reference Deep Curve Estimation,"* IEEE/CVF CVPR 2020.
