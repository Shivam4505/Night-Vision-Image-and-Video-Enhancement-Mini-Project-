"""
Video Processing Engine for Night Vision Enhancement System
- Frame-by-frame low-light enhancement without loading full video into RAM
- Real-time job progress tracking (percentage, frame count, elapsed & remaining time)
- FFmpeg audio extraction and muxing to preserve original sound
- Universal H.264/AAC MP4 encoding for instant browser playback
"""

import os
import time
import subprocess
import threading
from typing import Dict, Any, Optional
import cv2
import numpy as np

try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_EXE = "ffmpeg"


class VideoProcessor:
    def __init__(self, enhancer):
        self.enhancer = enhancer
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.cancel_flags: Dict[str, bool] = {}

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def cancel_job(self, job_id: str):
        if job_id in self.jobs:
            self.cancel_flags[job_id] = True
            self.jobs[job_id]["status"] = "cancelled"

    def start_processing(
        self,
        job_id: str,
        input_path: str,
        output_path: str,
        mode: str = "zerodce",
        gamma: float = 1.8,
        clahe_clip: float = 2.5,
        denoise: bool = True
    ):
        """Spawns background thread for frame-by-frame video processing."""
        self.jobs[job_id] = {
            "job_id": job_id,
            "status": "processing",
            "progress_percent": 0.0,
            "current_frame": 0,
            "total_frames": 0,
            "fps": 0.0,
            "elapsed_time": 0.0,
            "remaining_time": 0.0,
            "mode": mode,
            "input_file": os.path.basename(input_path),
            "output_file": os.path.basename(output_path),
            "output_path": output_path,
            "error": None
        }
        self.cancel_flags[job_id] = False

        thread = threading.Thread(
            target=self._process_video_thread,
            args=(job_id, input_path, output_path, mode, gamma, clahe_clip, denoise),
            daemon=True
        )
        thread.start()

    def _process_video_thread(
        self,
        job_id: str,
        input_path: str,
        output_path: str,
        mode: str,
        gamma: float,
        clahe_clip: float,
        denoise: bool
    ):
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            self.jobs[job_id]["status"] = "failed"
            self.jobs[job_id]["error"] = f"Failed to open input video: {input_path}"
            return

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Handle unknown frame count gracefully
        if total_frames <= 0:
            total_frames = 1

        self.jobs[job_id]["total_frames"] = total_frames
        self.jobs[job_id]["fps"] = round(fps, 2)

        # Temporary file for raw enhanced video stream
        temp_dir = os.path.dirname(output_path)
        temp_raw_output = os.path.join(temp_dir, f"temp_raw_{job_id}.mp4")

        # Codec for intermediate container
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(temp_raw_output, fourcc, fps, (width, height))

        if not writer.isOpened():
            # Fallback codec
            fourcc = cv2.VideoWriter_fourcc(*"XVID")
            temp_raw_output = os.path.join(temp_dir, f"temp_raw_{job_id}.avi")
            writer = cv2.VideoWriter(temp_raw_output, fourcc, fps, (width, height))

        start_time = time.time()
        frame_idx = 0

        try:
            while cap.isOpened():
                if self.cancel_flags.get(job_id, False):
                    break

                ret, frame = cap.read()
                if not ret:
                    break

                # Frame-by-frame low-light enhancement
                enhanced_frame = self.enhancer.enhance(
                    frame,
                    mode=mode,
                    gamma=gamma,
                    clahe_clip=clahe_clip,
                    denoise=denoise
                )

                writer.write(enhanced_frame)
                frame_idx += 1

                # Update progress statistics
                elapsed = time.time() - start_time
                progress = round((frame_idx / total_frames) * 100.0, 1)
                processing_fps = frame_idx / max(0.001, elapsed)
                remaining_frames = max(0, total_frames - frame_idx)
                remaining_time = round(remaining_frames / max(0.1, processing_fps), 1)

                self.jobs[job_id]["current_frame"] = frame_idx
                self.jobs[job_id]["progress_percent"] = min(100.0, progress)
                self.jobs[job_id]["elapsed_time"] = round(elapsed, 1)
                self.jobs[job_id]["remaining_time"] = remaining_time
                self.jobs[job_id]["processing_fps"] = round(processing_fps, 1)

        except Exception as e:
            self.jobs[job_id]["status"] = "failed"
            self.jobs[job_id]["error"] = str(e)
            return
        finally:
            cap.release()
            writer.release()

        if self.cancel_flags.get(job_id, False):
            if os.path.exists(temp_raw_output):
                try:
                    os.remove(temp_raw_output)
                except Exception:
                    pass
            return

        # Step 2: Post-process using FFmpeg to encode universal H.264 video and preserve audio
        try:
            self._mux_audio_and_encode_h264(input_path, temp_raw_output, output_path, fps)
            self.jobs[job_id]["status"] = "completed"
            self.jobs[job_id]["progress_percent"] = 100.0
            self.jobs[job_id]["remaining_time"] = 0.0
        except Exception as e:
            print(f"[FFmpeg Warning] Audio muxing/encoding failed: {e}. Falling back to raw output.")
            # If ffmpeg fails, rename temp raw output to final output
            if os.path.exists(temp_raw_output):
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_raw_output, output_path)
            self.jobs[job_id]["status"] = "completed"
            self.jobs[job_id]["progress_percent"] = 100.0
        finally:
            # Clean up temp file
            if os.path.exists(temp_raw_output):
                try:
                    os.remove(temp_raw_output)
                except Exception:
                    pass

    def _mux_audio_and_encode_h264(self, original_input: str, enhanced_video: str, final_output: str, fps: float):
        """
        Uses FFmpeg to:
        1. Transcode video track to H.264 (yuv420p) for universal browser playback
        2. Extract original audio track (if present) and mux into final MP4
        """
        ffmpeg_cmd = [
            FFMPEG_EXE,
            "-y",
            "-i", enhanced_video,
            "-i", original_input,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-crf", "22",
            "-c:a", "aac",
            "-b:a", "128k",
            "-map", "0:v:0",
            "-map", "1:a:0?",
            "-shortest",
            final_output
        ]

        result = subprocess.run(ffmpeg_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            # Fallback FFmpeg command without libx264 specific flags (in case standard mpeg4 is needed)
            fallback_cmd = [
                FFMPEG_EXE,
                "-y",
                "-i", enhanced_video,
                "-i", original_input,
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v:0",
                "-map", "1:a:0?",
                final_output
            ]
            subprocess.run(fallback_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
