"""
FastAPI Server for Night Vision Image & Video Enhancement System
Endpoints:
- /api/status: System, model & hardware information
- /api/image/enhance: Single image enhancement with quality metrics
- /api/video/enhance: Video upload and asynchronous processing
- /api/video/status/{job_id}: Processing progress polling
- /api/video/cancel/{job_id}: Video cancellation
- /api/live/process_frame: Real-time browser webcam frame processing
- /api/live/stream: MJPEG streaming from server-side webcam
- /api/files/uploads/{filename}: Static file serving
- /api/files/outputs/{filename}: Static file serving & download
"""

import os
import uuid
import time
import asyncio
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from pydantic import BaseModel
import cv2
import numpy as np

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    torch = None
    TORCH_AVAILABLE = False

from backend.enhancer import NightVisionEnhancer
from backend.video_processor import VideoProcessor
from backend.utils import analyze_image_metrics, b64_to_cv2, cv2_to_b64, cleanup_old_files

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))

if IS_SERVERLESS:
    UPLOAD_DIR = "/tmp/uploads"
    OUTPUT_DIR = "/tmp/outputs"
else:
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

MODEL_PATH = os.path.join(BASE_DIR, "models", "Epoch99.pth")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize core enhancement engine
enhancer = NightVisionEnhancer(model_path=MODEL_PATH)
video_processor = VideoProcessor(enhancer=enhancer)

app = FastAPI(
    title="Night Vision Image & Video Enhancement API",
    description="Deep Learning and Computer Vision System for Low-Light Enhancement",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
def get_system_status():
    """Returns system hardware, PyTorch device, model status, and versions."""
    cuda_available = torch.cuda.is_available() if (TORCH_AVAILABLE and torch) else False
    device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (Standard)"
    torch_ver = torch.__version__ if (TORCH_AVAILABLE and torch) else "N/A (OpenCV Mode)"
    
    return {
        "status": "online",
        "device": enhancer.device,
        "device_name": device_name,
        "cuda_available": cuda_available,
        "model_loaded": enhancer.has_model,
        "model_name": "Zero-DCE (Zero-Reference Deep Curve Estimation)" if enhancer.has_model else "Advanced OpenCV CLAHE Engine",
        "model_path": MODEL_PATH if os.path.exists(MODEL_PATH) else None,
        "torch_version": torch_ver,
        "opencv_version": cv2.__version__,
        "supported_modes": [
            {"id": "zerodce", "name": "Zero-DCE Deep Learning", "desc": "Pretrained 8-iteration curve estimation network"},
            {"id": "opencv", "name": "Advanced OpenCV Pipeline", "desc": "Gamma LUT + LAB CLAHE + Bilateral Denoising"},
            {"id": "hybrid", "name": "Hybrid (Zero-DCE + CLAHE)", "desc": "Combined neural curve & local contrast tuning"},
            {"id": "fast_realtime", "name": "Fast Real-Time (Webcam)", "desc": "Optimized low-latency 30+ FPS processing"}
        ]
    }


@app.post("/api/image/enhance")
async def enhance_image(
    file: UploadFile = File(...),
    mode: str = Form("zerodce"),
    gamma: float = Form(1.8),
    clahe_clip: float = Form(2.5),
    denoise: bool = Form(True),
    denoise_strength: float = Form(0.5)
):
    """
    Handles image upload, low-light detection, quality metric evaluation,
    and applies selected enhancement pipeline.
    """
    valid_exts = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Use JPG, PNG, WEBP, or BMP.")

    file_id = str(uuid.uuid4())[:8]
    original_filename = f"orig_{file_id}{ext}"
    enhanced_filename = f"enh_{file_id}{ext}"

    original_path = os.path.join(UPLOAD_DIR, original_filename)
    enhanced_path = os.path.join(OUTPUT_DIR, enhanced_filename)

    # Save uploaded file
    contents = await file.read()
    with open(original_path, "wb") as f:
        f.write(contents)

    # Read with OpenCV
    img_bgr = cv2.imread(original_path)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid image file or corrupted data.")

    # Calculate pre-enhancement metrics & detect low light
    orig_metrics = analyze_image_metrics(img_bgr)

    # Run enhancement
    start_t = time.time()
    enhanced_bgr = enhancer.enhance(
        img_bgr,
        mode=mode,
        gamma=gamma,
        clahe_clip=clahe_clip,
        denoise=denoise,
        denoise_strength=denoise_strength
    )
    inference_time = round((time.time() - start_t) * 1000, 1)

    # Calculate post-enhancement metrics
    enh_metrics = analyze_image_metrics(enhanced_bgr)

    # Save enhanced image
    cv2.imwrite(enhanced_path, enhanced_bgr)

    return {
        "success": True,
        "id": file_id,
        "filename": file.filename,
        "original_url": f"/api/files/uploads/{original_filename}",
        "enhanced_url": f"/api/files/outputs/{enhanced_filename}",
        "original_metrics": orig_metrics,
        "enhanced_metrics": enh_metrics,
        "mode_used": mode,
        "inference_time_ms": inference_time,
        "resolution": f"{img_bgr.shape[1]}x{img_bgr.shape[0]}"
    }


@app.post("/api/video/enhance")
async def enhance_video(
    file: UploadFile = File(...),
    mode: str = Form("zerodce"),
    gamma: float = Form(1.8),
    clahe_clip: float = Form(2.5),
    denoise: bool = Form(True)
):
    """
    Uploads video file and initiates asynchronous frame-by-frame enhancement.
    """
    valid_exts = [".mp4", ".avi", ".mov", ".mkv", ".webm"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported video format '{ext}'. Use MP4, AVI, MOV, or MKV.")

    job_id = str(uuid.uuid4())[:8]
    input_filename = f"orig_{job_id}{ext}"
    output_filename = f"enh_{job_id}.mp4"

    input_path = os.path.join(UPLOAD_DIR, input_filename)
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    contents = await file.read()
    with open(input_path, "wb") as f:
        f.write(contents)

    # Start asynchronous processing
    video_processor.start_processing(
        job_id=job_id,
        input_path=input_path,
        output_path=output_path,
        mode=mode,
        gamma=gamma,
        clahe_clip=clahe_clip,
        denoise=denoise
    )

    return {
        "success": True,
        "job_id": job_id,
        "filename": file.filename,
        "original_url": f"/api/files/uploads/{input_filename}",
        "status": "processing",
        "mode": mode
    }


@app.get("/api/video/status/{job_id}")
def get_video_status(job_id: str):
    """Polls real-time video processing progress."""
    job = video_processor.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Video job not found.")

    response = dict(job)
    if job.get("status") == "completed":
        response["enhanced_url"] = f"/api/files/outputs/{job['output_file']}"
    return response


@app.post("/api/video/cancel/{job_id}")
def cancel_video_job(job_id: str):
    """Cancels an ongoing video enhancement job."""
    video_processor.cancel_job(job_id)
    return {"success": True, "message": f"Job {job_id} cancelled."}


class FrameRequest(BaseModel):
    frame: str
    mode: str = "fast_realtime"
    gamma: float = 1.6
    clahe_clip: float = 2.0
    denoise: bool = True
    denoise_strength: float = 0.5


@app.post("/api/live/process_frame")
def process_live_frame(req: FrameRequest):
    """
    Processes a single frame from the browser webcam feed in real-time.
    Ultra-low latency base64 round-trip.
    """
    img_bgr = b64_to_cv2(req.frame)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Invalid frame data")

    # Measure luminance before
    gray_orig = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    orig_lum = float(np.mean(gray_orig))

    start_t = time.time()
    enhanced_bgr = enhancer.enhance(
        img_bgr,
        mode=req.mode,
        gamma=req.gamma,
        clahe_clip=req.clahe_clip,
        denoise=req.denoise,
        denoise_strength=req.denoise_strength
    )
    inference_ms = round((time.time() - start_t) * 1000, 1)

    gray_enh = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2GRAY)
    enh_lum = float(np.mean(gray_enh))

    enhanced_b64 = cv2_to_b64(enhanced_bgr, quality=80)

    return {
        "enhanced_frame": enhanced_b64,
        "inference_time_ms": inference_ms,
        "original_luminance": round(orig_lum, 1),
        "enhanced_luminance": round(enh_lum, 1),
        "boost_percent": round(((enh_lum - orig_lum) / max(1.0, orig_lum)) * 100.0, 1)
    }


def mjpeg_stream_generator(mode: str, gamma: float, clahe_clip: float):
    """Generator for streaming MJPEG webcam feed from OpenCV."""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        # Provide blank fallback with notice if no camera connected
        blank = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(blank, "No Hardware Camera Detected", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
        _, jpeg = cv2.imencode('.jpg', blank)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
        return

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            enhanced = enhancer.enhance(frame, mode=mode, gamma=gamma, clahe_clip=clahe_clip)
            # Create side-by-side feed
            combined = np.hstack([frame, enhanced])

            _, jpeg = cv2.imencode('.jpg', combined, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
    finally:
        cap.release()


@app.get("/api/live/stream")
def get_mjpeg_stream(mode: str = "fast_realtime", gamma: float = 1.6, clahe_clip: float = 2.0):
    """Streams server-side webcam MJPEG feed."""
    return StreamingResponse(
        mjpeg_stream_generator(mode, gamma, clahe_clip),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/files/uploads/{filename}")
def serve_upload_file(filename: str, download: bool = False):
    """Serves uploaded media files."""
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    media_type = "video/mp4" if filename.endswith((".mp4", ".mov", ".avi")) else "image/jpeg"
    headers = {"Content-Disposition": f"attachment; filename={filename}"} if download else None
    return FileResponse(filepath, media_type=media_type, headers=headers)


@app.get("/api/files/outputs/{filename}")
def serve_output_file(filename: str, download: bool = False):
    """Serves enhanced media files with download support."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    media_type = "video/mp4" if filename.endswith((".mp4", ".mov", ".avi")) else "image/jpeg"
    headers = {"Content-Disposition": f"attachment; filename={filename}"} if download else None
    return FileResponse(filepath, media_type=media_type, headers=headers)


@app.get("/api/download-manual")
def download_manual():
    """Serves the generated Microsoft Word (.docx) manual."""
    doc_path = os.path.join(BASE_DIR, "NIGHT_VISION_PROJECT_MANUAL.docx")
    if not os.path.exists(doc_path):
        raise HTTPException(status_code=404, detail="Manual not found")
    return FileResponse(
        doc_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename="NIGHT_VISION_PROJECT_MANUAL.docx"
    )


# Periodic cleanup background task
@app.on_event("startup")
async def startup_cleanup():
    cleanup_old_files(UPLOAD_DIR, max_age_seconds=7200)
    cleanup_old_files(OUTPUT_DIR, max_age_seconds=7200)

# Serve built React frontend from root if dist exists
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
