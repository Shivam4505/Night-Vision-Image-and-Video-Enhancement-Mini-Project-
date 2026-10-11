# 🚀 Deployment Guide: Vercel & Production

This guide covers deploying the **LUMINA: Night Vision Image & Video Enhancement System** to **Vercel** with automatic GitHub CI/CD integration.

---

## 🏗️ Architecture Overview

The project is structured as a modern full-stack application:
- **Frontend:** React 19 + Vite SPA with Tailwind-like glassmorphic UI, responsive comparison sliders, and real-time canvas processing.
- **Backend:** FastAPI with Dual-Engine enhancement:
  - **Zero-DCE Deep Learning (PyTorch CNN)**: Dynamic curve estimation.
  - **Advanced OpenCV Pipeline**: LAB CLAHE + Gamma LUT + Bilateral Denoising + Unsharp Mask.
- **Vercel Adaptations included in codebase:**
  - `api/index.py`: Serverless Python entrypoint for Vercel.
  - `api/requirements.txt`: Lightweight headless requirements (`opencv-python-headless`) tuned for serverless runtime.
  - Ephemeral `/tmp` storage paths in `backend/main.py` so uploads/outputs work without read-only filesystem errors.
  - Dynamic `VITE_API_URL` support via `frontend/src/config.js` for seamless split-host or monorepo setups.

---

## ⚡ Option 1: Full-Stack Monorepo on Vercel (Fastest)

Deploy both the frontend and backend directly on Vercel from this single repository.

### Step 1: Import Repository to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Select your GitHub repository: `Shivam4505/Night-Vision-Image-and-Video-Enhancement-Mini-Project-`.

### Step 2: Configure Project Settings
- **Root Directory:** Leave as `./` (default).
- The root `vercel.json` will automatically configure:
  - Backend routing (`/api/*` -> `api/index.py`)
  - Frontend static build (`npm run build` inside `frontend/` -> `frontend/dist`)

### Step 3: Configure Environment Variables (Vercel Settings)
In the Vercel project deployment screen, expand **Environment Variables**:
| Variable Name | Value | Purpose |
|---------------|-------|---------|
| `VERCEL_SUPPORT_LARGE_FUNCTIONS` | `1` | Enables extended serverless package sizes on Vercel Fluid Compute |

### Step 4: Click Deploy
Vercel will build both the Python serverless API and the Vite frontend bundle.

---

## 🌐 Option 2: Split Deployment (Recommended for Large Videos & PyTorch GPU)

For intensive video frame transcoding with FFmpeg or GPU-accelerated deep learning inference, deploy the backend to a dedicated Python host (e.g., Render, Railway, or Fly.io) and host the frontend on Vercel's global Edge CDN.

### Step 1: Deploy Backend (Render / Railway / Hugging Face)
1. Create a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Connect your GitHub repository.
3. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn backend.main:app --host 0.0.0.0 --port 10000`
4. Copy your deployed backend URL (e.g., `https://night-vision-api.onrender.com`).

### Step 2: Deploy Frontend on Vercel
1. In Vercel, import the same repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. In **Environment Variables**, add:
   ```env
   VITE_API_URL=https://night-vision-api.onrender.com
   ```
5. Click **Deploy**. The frontend will automatically route all image enhancement, video tracking, and webcam feeds to your high-performance backend!

---

## 🛠️ Local Development

To run the application locally on your machine:

```bash
# 1. Activate Python virtual environment and start backend
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000

# 2. In a separate terminal, start frontend
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:3000`.
