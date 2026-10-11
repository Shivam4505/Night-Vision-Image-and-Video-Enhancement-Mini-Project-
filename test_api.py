import urllib.request
import json
import uuid
import cv2
import numpy as np
import time

def test_api():
    print("Testing API endpoints...")

    # 1. Status
    res = urllib.request.urlopen("http://127.0.0.1:8000/api/status")
    status_data = json.loads(res.read().decode("utf-8"))
    print("Status:", status_data["status"], "| Model loaded:", status_data["model_loaded"])

    # 2. Image upload test
    dark = np.zeros((180, 240, 3), dtype=np.uint8)
    dark[20:100, 30:150] = [20, 25, 35]
    _, buffer = cv2.imencode(".jpg", dark)
    file_bytes = buffer.tobytes()

    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test.jpg"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8") + file_bytes + (
        f"\r\n--{boundary}\r\n"
        f'Content-Disposition: form-data; name="mode"\r\n\r\nzerodce\r\n'
        f"--{boundary}--\r\n"
    ).encode("utf-8")

    req = urllib.request.Request("http://127.0.0.1:8000/api/image/enhance", data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    res = urllib.request.urlopen(req)
    img_resp = json.loads(res.read().decode("utf-8"))
    print("Image enhance response:", img_resp["success"], "Inference:", img_resp["inference_time_ms"], "ms")
    print("Mean brightness:", img_resp["original_metrics"]["mean_brightness"], "->", img_resp["enhanced_metrics"]["mean_brightness"])
    assert img_resp["success"] is True

    # 3. Live process_frame test
    import base64
    b64_str = f"data:image/jpeg;base64,{base64.b64encode(file_bytes).decode('utf-8')}"
    req_data = json.dumps({
        "frame": b64_str,
        "mode": "fast_realtime",
        "gamma": 1.6,
        "clahe_clip": 2.0,
        "denoise": True
    }).encode("utf-8")

    req = urllib.request.Request("http://127.0.0.1:8000/api/live/process_frame", data=req_data)
    req.add_header("Content-Type", "application/json")
    res = urllib.request.urlopen(req)
    live_resp = json.loads(res.read().decode("utf-8"))
    print("Live frame inference:", live_resp["inference_time_ms"], "ms, Boost:", live_resp["boost_percent"], "%")
    assert "enhanced_frame" in live_resp

    print("ALL API ENDPOINT TESTS PASSED!")

if __name__ == "__main__":
    test_api()
