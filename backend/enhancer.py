"""
Core Night Vision Enhancement Engine
Combines:
1. Zero-DCE Deep Convolutional Neural Network (PyTorch)
2. Advanced OpenCV Multi-Stage Pipeline (CLAHE, Gamma LUT, LAB space, Bilateral Denoising)
3. Hybrid Mode (Zero-DCE + Adaptive Contrast + Noise Suppression)
4. Fast Real-Time Mode (for low-latency webcam streaming)
"""

import os
import cv2
import numpy as np
import torch
from backend.model import load_dce_model, DCENet


class NightVisionEnhancer:
    def __init__(self, model_path: str = "models/Epoch99.pth", prefer_cuda: bool = True):
        # Hardware acceleration detection
        if prefer_cuda and torch.cuda.is_available():
            self.device = "cuda"
            self.device_name = torch.cuda.get_device_name(0)
        else:
            self.device = "cpu"
            self.device_name = "CPU"

        print(f"[Enhancer] Initializing on device: {self.device} ({self.device_name})")

        # Load Zero-DCE model
        self.model, _ = load_dce_model(model_path, self.device)
        self.has_model = self.model is not None

        # Precompute common Gamma Lookup Tables (LUTs) for O(1) performance
        self.gamma_luts = {}
        for g in [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4]:
            inv_gamma = 1.0 / g
            lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
            self.gamma_luts[round(g, 1)] = lut

        # Initialize CLAHE instances
        self.clahe_standard = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        self.clahe_subtle = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
        self.clahe_strong = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))

    def _get_gamma_lut(self, gamma: float) -> np.ndarray:
        gamma_key = round(gamma, 1)
        if gamma_key in self.gamma_luts:
            return self.gamma_luts[gamma_key]
        inv_gamma = 1.0 / max(0.1, gamma)
        lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
        self.gamma_luts[gamma_key] = lut
        return lut

    def enhance_zerodce(self, img_bgr: np.ndarray, denoise: bool = True, denoise_strength: float = 0.5) -> np.ndarray:
        """
        Enhances image using Zero-Reference Deep Curve Estimation (Zero-DCE).
        Falls back to OpenCV pipeline if model is unavailable.
        """
        if not self.has_model:
            return self.enhance_opencv(img_bgr)

        h, w, c = img_bgr.shape

        # Zero-DCE expects RGB normalized to [0, 1]
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        img_norm = (img_rgb / 255.0).astype(np.float32)

        # Convert to Tensor (1, C, H, W)
        tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)

        with torch.no_grad():
            enhanced_tensor, _ = self.model(tensor)

        # Convert back to numpy BGR [0, 255]
        enhanced_np = enhanced_tensor.squeeze(0).permute(1, 2, 0).cpu().numpy()
        enhanced_np = np.clip(enhanced_np * 255.0, 0, 255).astype(np.uint8)
        enhanced_bgr = cv2.cvtColor(enhanced_np, cv2.COLOR_RGB2BGR)

        # Optional subtle edge-preserving denoising to mitigate low-light sensor noise
        if denoise and denoise_strength > 0:
            d = 5 if denoise_strength < 0.7 else 7
            sigma = int(25 * denoise_strength)
            enhanced_bgr = cv2.bilateralFilter(enhanced_bgr, d=d, sigmaColor=sigma, sigmaSpace=sigma)

        return enhanced_bgr

    def enhance_opencv(
        self,
        img_bgr: np.ndarray,
        gamma: float = 1.8,
        clahe_clip: float = 2.5,
        denoise: bool = True,
        color_boost: float = 1.15,
        unsharp: bool = True
    ) -> np.ndarray:
        """
        Advanced OpenCV Multi-Stage Low-Light Enhancement Pipeline:
        1. Fast Gamma LUT correction
        2. LAB space CLAHE on L-channel (preserves color fidelity, boosts illumination & local contrast)
        3. Color saturation restoration in HSV space
        4. Edge-preserving bilateral noise suppression
        5. Unsharp masking for crisp night detail
        """
        # Step 1: Pre-Denoising (subtle to remove camera sensor noise before contrast amplification)
        if denoise:
            step1 = cv2.bilateralFilter(img_bgr, d=5, sigmaColor=25, sigmaSpace=25)
        else:
            step1 = img_bgr

        # Step 2: Gamma Correction (LUT)
        lut = self._get_gamma_lut(gamma)
        step2 = cv2.LUT(step1, lut)

        # Step 3: CLAHE in LAB space
        lab = cv2.cvtColor(step2, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        lab_enhanced = cv2.merge((l_enhanced, a, b))
        step3 = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        # Step 4: Color Boost in HSV
        if color_boost > 1.0:
            hsv = cv2.cvtColor(step3, cv2.COLOR_BGR2HSV).astype(np.float32)
            h, s, v = cv2.split(hsv)
            s = np.clip(s * color_boost, 0, 255)
            hsv_boosted = cv2.merge((h, s, v)).astype(np.uint8)
            step4 = cv2.cvtColor(hsv_boosted, cv2.COLOR_HSV2BGR)
        else:
            step4 = step3

        # Step 5: Unsharp Masking for detail definition
        if unsharp:
            blurred = cv2.GaussianBlur(step4, (0, 0), sigmaX=1.5)
            # Add weighted: 1.25 * original - 0.25 * blurred
            sharpened = cv2.addWeighted(step4, 1.25, blurred, -0.25, 0)
            return sharpened

        return step4

    def enhance_hybrid(
        self,
        img_bgr: np.ndarray,
        gamma: float = 1.3,
        clahe_blend: float = 0.35,
        denoise_strength: float = 0.5
    ) -> np.ndarray:
        """
        Hybrid Enhancement: Combines Zero-DCE's non-linear illumination estimation
        with LAB-space CLAHE micro-contrast and bilateral smoothing.
        """
        # Run Zero-DCE
        dce_enhanced = self.enhance_zerodce(img_bgr, denoise=False)

        # Apply subtle CLAHE to further reveal deep shadow textures
        lab = cv2.cvtColor(dce_enhanced, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l_clahe = self.clahe_subtle.apply(l)
        lab_clahe = cv2.merge((l_clahe, a, b))
        clahe_enhanced = cv2.cvtColor(lab_clahe, cv2.COLOR_LAB2BGR)

        # Blend Zero-DCE with CLAHE
        blended = cv2.addWeighted(dce_enhanced, 1.0 - clahe_blend, clahe_enhanced, clahe_blend, 0)

        # Denoising
        if denoise_strength > 0:
            sigma = int(30 * denoise_strength)
            blended = cv2.bilateralFilter(blended, d=5, sigmaColor=sigma, sigmaSpace=sigma)

        return blended

    def enhance_realtime(self, img_bgr: np.ndarray, gamma: float = 1.6, clahe_clip: float = 2.0) -> np.ndarray:
        """
        Lightweight, ultra-fast pipeline optimized for 30+ FPS real-time webcam streams.
        Avoids heavy float conversions and uses integer LUT + LAB CLAHE.
        """
        lut = self._get_gamma_lut(gamma)
        gamma_corrected = cv2.LUT(img_bgr, lut)

        lab = cv2.cvtColor(gamma_corrected, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=(8, 8))
        l = clahe.apply(l)
        enhanced = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

        return enhanced

    def enhance(
        self,
        img_bgr: np.ndarray,
        mode: str = "zerodce",
        gamma: float = 1.8,
        clahe_clip: float = 2.5,
        denoise: bool = True,
        denoise_strength: float = 0.5
    ) -> np.ndarray:
        """
        Unified dispatch method.
        Modes: 'zerodce', 'opencv', 'hybrid', 'fast_realtime'
        """
        mode = mode.lower()
        if mode == "zerodce":
            return self.enhance_zerodce(img_bgr, denoise=denoise, denoise_strength=denoise_strength)
        elif mode == "opencv":
            return self.enhance_opencv(img_bgr, gamma=gamma, clahe_clip=clahe_clip, denoise=denoise)
        elif mode == "hybrid":
            return self.enhance_hybrid(img_bgr, gamma=gamma, denoise_strength=denoise_strength)
        elif mode == "fast_realtime":
            return self.enhance_realtime(img_bgr, gamma=gamma, clahe_clip=clahe_clip)
        else:
            return self.enhance_zerodce(img_bgr, denoise=denoise, denoise_strength=denoise_strength)
