"""
Zero-DCE (Zero-Reference Deep Curve Estimation) PyTorch Model Architecture
Reference: Li et al., "Zero-Reference Deep Curve Estimation for Low-Light Image Enhancement", CVPR 2020.
"""

import os
import torch
import torch.nn as nn
import torch.nn.functional as F


class DCENet(nn.Module):
    """
    DCE-Net estimates pixel-wise high-order curves for dynamic range adjustment.
    Takes an input RGB image and predicts 24 parameter maps (8 iterations x 3 channels).
    """
    def __init__(self, n_filters: int = 32):
        super(DCENet, self).__init__()
        self.relu = nn.ReLU(inplace=True)

        self.e_conv1 = nn.Conv2d(3, n_filters, 3, 1, 1, bias=True)
        self.e_conv2 = nn.Conv2d(n_filters, n_filters, 3, 1, 1, bias=True)
        self.e_conv3 = nn.Conv2d(n_filters, n_filters, 3, 1, 1, bias=True)
        self.e_conv4 = nn.Conv2d(n_filters, n_filters, 3, 1, 1, bias=True)

        self.e_conv5 = nn.Conv2d(n_filters * 2, n_filters, 3, 1, 1, bias=True)
        self.e_conv6 = nn.Conv2d(n_filters * 2, n_filters, 3, 1, 1, bias=True)
        self.e_conv7 = nn.Conv2d(n_filters * 2, 24, 3, 1, 1, bias=True)

    def forward(self, x: torch.Tensor):
        """
        Forward pass applying symmetrical skip-connected CNN feature extraction
        and 8-stage recursive curve enhancement.
        """
        # Feature extraction with skip connections
        x1 = self.relu(self.e_conv1(x))
        x2 = self.relu(self.e_conv2(x1))
        x3 = self.relu(self.e_conv3(x2))
        x4 = self.relu(self.e_conv4(x3))

        x5 = self.relu(self.e_conv5(torch.cat([x3, x4], dim=1)))
        x6 = self.relu(self.e_conv6(torch.cat([x2, x5], dim=1)))
        
        # Output 24 parameter maps bounded in [-1, 1] using tanh
        param_maps = torch.tanh(self.e_conv7(torch.cat([x1, x6], dim=1)))

        # Split parameter maps into 8 sets of 3-channel (RGB) parameter maps
        r1, r2, r3, r4, r5, r6, r7, r8 = torch.split(param_maps, 3, dim=1)

        # 8-iteration curve estimation: LE_n(x) = LE_{n-1}(x) + A_n * LE_{n-1}(x) * (1 - LE_{n-1}(x))
        # Note: (torch.pow(x, 2) - x) is x^2 - x = -x*(1-x), matched to official weight parameter sign convention
        curr = x
        curr = curr + r1 * (torch.pow(curr, 2) - curr)
        curr = curr + r2 * (torch.pow(curr, 2) - curr)
        curr = curr + r3 * (torch.pow(curr, 2) - curr)
        curr = curr + r4 * (torch.pow(curr, 2) - curr)
        curr = curr + r5 * (torch.pow(curr, 2) - curr)
        curr = curr + r6 * (torch.pow(curr, 2) - curr)
        curr = curr + r7 * (torch.pow(curr, 2) - curr)
        enhanced = curr + r8 * (torch.pow(curr, 2) - curr)

        enhanced = torch.clamp(enhanced, 0.0, 1.0)
        return enhanced, param_maps


def load_dce_model(model_path: str = "models/Epoch99.pth", device: str = None) -> tuple[DCENet | None, str]:
    """
    Load pre-trained Zero-DCE model weights onto the selected device (CUDA or CPU).
    Returns (model, device_name).
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    model = DCENet().to(device)
    model.eval()

    if os.path.exists(model_path):
        try:
            state_dict = torch.load(model_path, map_location=device, weights_only=True)
            # Remove any possible module. prefixes from DataParallel training
            cleaned_state_dict = {}
            for k, v in state_dict.items():
                if k.startswith("module."):
                    cleaned_state_dict[k[7:]] = v
                else:
                    cleaned_state_dict[k] = v
            model.load_state_dict(cleaned_state_dict)
            print(f"[Model] Zero-DCE weights loaded successfully from '{model_path}' on {device.upper()}.")
            return model, device
        except Exception as e:
            print(f"[Model Warning] Could not load weights from '{model_path}': {e}. Using uninitialized/fallback model.")
            return None, device
    else:
        print(f"[Model Warning] Pretrained weights file '{model_path}' not found.")
        return None, device
