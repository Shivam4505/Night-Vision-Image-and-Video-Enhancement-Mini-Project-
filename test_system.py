import os
import cv2
import numpy as np
from backend.enhancer import NightVisionEnhancer
from backend.utils import analyze_image_metrics
from backend.video_processor import VideoProcessor
import time

def test_pipeline():
    print("=== Testing Night Vision Enhancement Pipeline ===")
    enhancer = NightVisionEnhancer("models/Epoch99.pth")
    print(f"Device: {enhancer.device}, Model Loaded: {enhancer.has_model}")
    assert enhancer.has_model, "Model should be loaded"

    # Create dark test image
    dark_img = np.zeros((240, 320, 3), dtype=np.uint8)
    # Add dim shapes
    cv2.rectangle(dark_img, (30, 30), (100, 150), (25, 30, 45), -1)
    cv2.circle(dark_img, (200, 120), 40, (40, 20, 30), -1)
    cv2.putText(dark_img, "TEST TARGET", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (50, 60, 50), 1)

    orig_metrics = analyze_image_metrics(dark_img)
    print("Original metrics:", orig_metrics)
    assert orig_metrics["is_low_light"] == True, "Image should be classified as low-light"

    # Test all 4 modes
    for mode in ["zerodce", "opencv", "hybrid", "fast_realtime"]:
        t0 = time.time()
        enh = enhancer.enhance(dark_img, mode=mode)
        dt = (time.time() - t0) * 1000
        enh_metrics = analyze_image_metrics(enh)
        print(f"Mode [{mode:13s}] inference: {dt:5.1f}ms | Brightness: {orig_metrics['mean_brightness']} -> {enh_metrics['mean_brightness']}")
        assert enh.shape == dark_img.shape, f"Shape mismatch in mode {mode}"
        assert enh_metrics["mean_brightness"] > orig_metrics["mean_brightness"], f"Brightness should increase in mode {mode}"

    # Test Video Processing
    print("\n=== Testing Video Processing ===")
    test_video_path = "uploads/test_dark_video.mp4"
    out_video_path = "outputs/test_enh_video.mp4"
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)

    # Write a 1-second 15fps dark video
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    vw = cv2.VideoWriter(test_video_path, fourcc, 15.0, (320, 240))
    for f in range(15):
        frame = dark_img.copy()
        cv2.circle(frame, (30 + f * 15, 120), 15, (30, 50, 70), -1)
        vw.write(frame)
    vw.release()
    print("Created test video:", test_video_path)

    vp = VideoProcessor(enhancer)
    vp.start_processing("job_test", test_video_path, out_video_path, mode="opencv")

    for _ in range(30):
        time.sleep(0.5)
        job = vp.get_job("job_test")
        print(f"Video job status: {job['status']} ({job['progress_percent']}%) frame {job['current_frame']}/{job['total_frames']}")
        if job["status"] in ["completed", "failed"]:
            break

    assert job["status"] == "completed", f"Job failed: {job.get('error')}"
    assert os.path.exists(out_video_path), "Enhanced video file should exist"
    print(f"SUCCESS! Output video size: {os.path.getsize(out_video_path)} bytes")
    print("=== All Pipeline Tests Passed Successfully! ===")

if __name__ == "__main__":
    test_pipeline()
