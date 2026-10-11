"""
Utility functions for night vision enhancement system:
- Image quality and illumination analysis
- Low-light condition detection
- Base64 encoding/decoding for live streaming
- File and directory management
"""

import os
import time
import base64
import numpy as np
import cv2


def analyze_image_metrics(img_bgr: np.ndarray) -> dict:
    """
    Computes objective illumination and image quality metrics:
    - Mean brightness (0 - 255)
    - RMS contrast
    - Dynamic range (5th to 95th percentile)
    - Shannon entropy (measure of texture and detail)
    - Low-light classification and confidence score
    """
    if img_bgr is None or img_bgr.size == 0:
        return {}

    # Convert to grayscale / Y-channel (luminance)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    mean_val = float(np.mean(gray))
    std_val = float(np.std(gray)) # RMS Contrast
    p5 = float(np.percentile(gray, 5))
    p95 = float(np.percentile(gray, 95))
    dynamic_range = float(p95 - p5)

    # Shannon Entropy
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist = hist / (hist.sum() + 1e-7)
    non_zeros = hist[hist > 0]
    entropy = float(-np.sum(non_zeros * np.log2(non_zeros)))

    # Low light classification
    # Normal daytime photos typically have mean luminance 100 - 160.
    # Night / low light photos typically have mean luminance < 75.
    is_low_light = mean_val < 75.0
    if mean_val < 40.0:
        severity = "Severe Darkness"
    elif mean_val < 65.0:
        severity = "Moderate Low-Light"
    elif mean_val < 85.0:
        severity = "Mild Underexposure"
    else:
        severity = "Adequate Lighting"

    # Colorfulness metric (Hasler and Süsstrunk, 2003)
    (B, G, R) = cv2.split(img_bgr.astype("float"))
    rg = np.absolute(R - G)
    yb = np.absolute(0.5 * (R + G) - B)
    std_rg, mean_rg = np.std(rg), np.mean(rg)
    std_yb, mean_yb = np.std(yb), np.mean(yb)
    std_rgyb = np.sqrt(std_rg ** 2 + std_yb ** 2)
    mean_rgyb = np.sqrt(mean_rg ** 2 + mean_yb ** 2)
    colorfulness = float(std_rgyb + (0.3 * mean_rgyb))

    return {
        "mean_brightness": round(mean_val, 2),
        "contrast_rms": round(std_val, 2),
        "dynamic_range": round(dynamic_range, 2),
        "entropy": round(entropy, 3),
        "colorfulness": round(colorfulness, 2),
        "is_low_light": is_low_light,
        "lighting_status": severity,
        "illumination_score": round(min(100.0, (mean_val / 255.0) * 100.0), 1)
    }


def b64_to_cv2(b64_string: str) -> np.ndarray | None:
    """Decodes a base64 JPEG/PNG string into an OpenCV BGR numpy array."""
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img_bgr
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None


def cv2_to_b64(img_bgr: np.ndarray, quality: int = 85) -> str:
    """Encodes an OpenCV BGR image into a base64 JPEG data URL."""
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    success, buffer = cv2.imencode(".jpg", img_bgr, encode_params)
    if not success:
        return ""
    b64_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{b64_str}"


def cleanup_old_files(directory: str, max_age_seconds: int = 3600):
    """Deletes files in directory older than max_age_seconds to prevent disk bloat."""
    if not os.path.exists(directory):
        return
    now = time.time()
    for filename in os.listdir(directory):
        if filename == ".gitkeep":
            continue
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            try:
                if os.stat(filepath).st_mtime < (now - max_age_seconds):
                    os.remove(filepath)
            except Exception:
                pass
