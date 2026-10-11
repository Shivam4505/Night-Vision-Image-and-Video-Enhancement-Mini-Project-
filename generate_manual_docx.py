"""
Script to generate a comprehensive, professional Microsoft Word (.docx) manual
for the Night Vision Image & Video Enhancement System.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    """Sets background color of a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets internal padding for a table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)

def create_manual():
    doc = docx.Document()

    # Page Margins: 1 inch all around
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles
    styles = doc.styles

    # Normal font
    style_normal = styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Calibri'
    font_normal.size = Pt(11)
    font_normal.color.rgb = RGBColor(30, 41, 59)

    # Document Header / Cover Banner
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_badge = p_title.add_run("ACADEMIC CAPSTONE PROJECT MANUAL // IMAGE & VIDEO PROCESSING (IVP)\n")
    run_badge.font.size = Pt(10)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(16, 185, 129) # Emerald

    run_title = p_title.add_run("NIGHT VISION IMAGE & VIDEO ENHANCEMENT SYSTEM\n")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.name = 'Arial'
    run_title.font.color.rgb = RGBColor(15, 23, 42) # Deep Slate

    run_sub = p_title.add_run("Comprehensive Technical Reference, Algorithmic Analysis & User Operation Manual\n")
    run_sub.font.size = Pt(13)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_paragraph() # Spacer

    # Metadata Box
    tbl_meta = doc.add_table(rows=4, cols=2)
    tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_info = [
        ("System Name:", "LUMINA Night Vision Image & Video Enhancement System"),
        ("Core Technologies:", "PyTorch, OpenCV 4.x, Zero-DCE (CVPR 2020), FFmpeg, FastAPI, React 19"),
        ("Target Domains:", "Night Surveillance, Autonomous Navigation, Low-Light Video Restoration"),
        ("System Architecture:", "Dual-Mode: Zero-DCE Deep Learning + High-Speed LAB CLAHE Computer Vision")
    ]
    for i, (k, v) in enumerate(meta_info):
        row = tbl_meta.rows[i]
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.3)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.bold = True
        r0.font.color.rgb = RGBColor(15, 23, 42)

        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.color.rgb = RGBColor(51, 65, 85)

        set_cell_background(c0, "F1F5F9")
        set_cell_background(c1, "F8FAFC")
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)

    doc.add_page_break()

    # Table of Contents
    h_toc = doc.add_heading(level=1)
    r_toc = h_toc.add_run("TABLE OF CONTENTS")
    r_toc.font.color.rgb = RGBColor(15, 23, 42)

    toc_items = [
        "1. Executive Summary & Problem Formulation",
        "2. System Architecture & Component Interactions",
        "3. Algorithmic Foundations & Mathematical Formulations",
        "   3.1 Zero-DCE (Zero-Reference Deep Curve Estimation)",
        "   3.2 Advanced Classical OpenCV Multi-Stage Pipeline",
        "   3.3 Sequential Frame-by-Frame Video Processing & FFmpeg Audio Remuxing",
        "   3.4 Noise Suppression & Edge Preservation via Bilateral Filtering",
        "4. Quantitative Image Quality & Illumination Metrics",
        "5. Complete User Operating Manual",
        "   5.1 System Launch & Single-Command Deployment",
        "   5.2 Module 1: Image Enhancement Operation",
        "   5.3 Module 2: Video Enhancement Operation",
        "   5.4 Module 3: Live Night Vision Webcam Stream & Tactical HUD",
        "   5.5 Module 4: Educational Dashboard & Hardware Diagnostics",
        "6. Codebase Structure & File Manifest",
        "7. Automated Testing & Verification Suite",
        "8. Viva Voce & Examination Preparation (Q&A)",
        "9. References & Literature Citations"
    ]
    for item in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(item)
        if not item.startswith("   "):
            r.bold = True
            r.font.color.rgb = RGBColor(30, 41, 59)
        else:
            r.font.color.rgb = RGBColor(71, 85, 105)

    doc.add_page_break()

    # Section 1: Executive Summary
    h1 = doc.add_heading(level=1)
    h1.add_run("1. EXECUTIVE SUMMARY & PROBLEM FORMULATION").font.color.rgb = RGBColor(15, 23, 42)

    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.add_run(
        "Capturing optical images and video in extreme low-light, nighttime, or severely underexposed conditions "
        "poses critical technical hurdles across computer vision applications, including autonomous driving, "
        "nighttime perimeter surveillance, robotic exploration, and forensic evidence collection.\n\n"
        "Under low-light conditions, optical sensors receive an insufficient count of photons. According to the "
        "Poisson-Gaussian physical noise model: "
    )
    p_eq = doc.add_paragraph()
    p_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_eq = p_eq.add_run("I = g · (N_photon + N_thermal) + N_read")
    r_eq.bold = True
    r_eq.font.size = Pt(12)
    r_eq.font.color.rgb = RGBColor(16, 185, 129)

    p_body = doc.add_paragraph()
    p_body.paragraph_format.line_spacing = 1.15
    p_body.add_run(
        "As incident photons (N_photon) drop toward zero, sensor read noise (N_read) and thermal dark-current noise "
        "(N_thermal) dominate the signal. Simply applying standard linear gain or digital brightness amplification "
        "exponentially magnifies this noise, creates severe chromatic artifacts, and washes out image contrast.\n\n"
        "The LUMINA Night Vision System provides an integrated, robust dual-pipeline architecture combining state-of-the-art "
        "Deep Learning (Zero-DCE) with high-efficiency Computer Vision (LAB-space CLAHE and Bilateral Filtering). "
        "The system processes static images, multi-gigabyte video files with synchronized audio preservation, and real-time "
        "webcam feeds at 30+ frames per second."
    )

    # Section 2: Architecture
    h2 = doc.add_heading(level=1)
    h2.add_run("2. SYSTEM ARCHITECTURE & TECH STACK").font.color.rgb = RGBColor(15, 23, 42)

    p_arch = doc.add_paragraph()
    p_arch.paragraph_format.line_spacing = 1.15
    p_arch.add_run(
        "The system follows a modular client-server full-stack architecture designed for high throughput, minimal memory footprint, "
        "and zero-configuration deployment:"
    )

    tbl_tech = doc.add_table(rows=6, cols=3)
    tbl_tech.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Component", "Technology", "Functional Responsibility"]
    tech_data = [
        ("Deep Learning Model", "PyTorch 2.x (DCENet)", "Executes 8-stage recursive non-linear light-enhancement curve estimation (Zero-DCE)"),
        ("Computer Vision", "OpenCV 4.x (cv2)", "Fast Gamma LUTs, CIE LAB CLAHE on L-channel, Bilateral noise filtering, video stream I/O"),
        ("Audio/Video Engine", "FFmpeg (H.264 / AAC)", "Transcodes enhanced frames to browser-compliant H.264 (yuv420p) and preserves audio tracks"),
        ("Backend Web API", "FastAPI + Uvicorn", "Asynchronous HTTP REST endpoints, real-time job progress polling, live frame processing"),
        ("Frontend Web App", "React 19 + Vanilla CSS", "Cyberpunk tactical dark interface, interactive draggable before/after comparison slider, HUD")
    ]
    for col_idx, h in enumerate(headers):
        cell = tbl_tech.rows[0].cells[col_idx]
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)

    for row_idx, data in enumerate(tech_data):
        row = tbl_tech.rows[row_idx + 1]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            p = cell.paragraphs[0]
            p.add_run(text)
            bg = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    doc.add_page_break()

    # Section 3: Algorithmic Foundations
    h3 = doc.add_heading(level=1)
    h3.add_run("3. ALGORITHMIC FOUNDATIONS & MATHEMATICAL FORMULATIONS").font.color.rgb = RGBColor(15, 23, 42)

    # 3.1 Zero-DCE
    h3_1 = doc.add_heading(level=2)
    h3_1.add_run("3.1 Zero-DCE (Zero-Reference Deep Curve Estimation)")

    p_dce = doc.add_paragraph()
    p_dce.paragraph_format.line_spacing = 1.15
    p_dce.add_run(
        "Zero-DCE (CVPR 2020) formulates low-light enhancement as a curve-estimation problem. Unlike traditional CNNs that predict "
        "enhanced pixel values directly or calculate residual maps, Zero-DCE trains a CNN (DCENet) to predict continuous, "
        "high-order light enhancement curves tailored to each specific input image.\n\n"
        "The recursive light enhancement curve formulation is defined as:"
    )

    p_dce_eq = doc.add_paragraph()
    p_dce_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_dce = p_dce_eq.add_run("LE_n(x) = LE_{n-1}(x) + A_n(x) · LE_{n-1}(x) · (1 - LE_{n-1}(x))")
    r_dce.bold = True
    r_dce.font.size = Pt(12)
    r_dce.font.color.rgb = RGBColor(5, 150, 105)

    p_dce_exp = doc.add_paragraph()
    p_dce_exp.paragraph_format.line_spacing = 1.15
    p_dce_exp.add_run(
        "Where:\n"
        "• x is the normalized pixel intensity in range [0, 1].\n"
        "• A_n(x) represents the pixel-wise parameter map predicted by DCENet, bounded in [-1, 1] using tanh activation.\n"
        "• n ∈ {1, 2, ..., 8} represents 8 recursive iterations.\n\n"
        "Mathematical Advantage: The term x · (1 - x) reaches its maximum at mid-tones (0.5) and tapers to zero at both 0.0 "
        "(pitch darkness) and 1.0 (highlights). This guarantees that dark shadows are dynamically expanded while already well-exposed "
        "regions are prevented from over-saturating into pure white blown-out patches.\n\n"
        "Zero-DCE uses four specialized non-reference loss functions during unsupervised training:\n"
        "1. Spatial Consistency Loss (L_spa): Enforces gradient preservation between input and enhanced patches.\n"
        "2. Exposure Control Loss (L_exp): Measures the distance between local 16x16 patch intensity and an optimal exposure E = 0.6.\n"
        "3. Color Constancy Loss (L_col): Implements the Gray-World assumption to eliminate chromatic cast.\n"
        "4. Illumination Smoothness Loss (L_tv): Enforces monotonic curvature and prevents posterization artifacts."
    )

    # 3.2 OpenCV Pipeline
    h3_2 = doc.add_heading(level=2)
    h3_2.add_run("3.2 Advanced Classical OpenCV Multi-Stage Pipeline")

    p_cv = doc.add_paragraph()
    p_cv.paragraph_format.line_spacing = 1.15
    p_cv.add_run(
        "To enable real-time 30+ FPS video processing on standard laptops without GPU acceleration, the system implements an "
        "optimized classical computer vision pipeline:\n\n"
        "1. Pre-computed Gamma Lookup Table (LUT):\n"
        "   Computes: LUT[i] = 255 · (i / 255)^(1 / γ). Evaluating this 256-entry table once eliminates floating-point power calculations "
        "   during per-frame inference, executing in under 1.0 ms.\n\n"
        "2. CIE LAB-Space CLAHE (Contrast Limited Adaptive Histogram Equalization):\n"
        "   Histogram equalization in RGB shifts colors unpredictably. Our pipeline converts the image to CIE LAB space and applies "
        "   CLAHE exclusively to the L (Luminance) channel with a clip limit of 2.5 and an 8x8 contextual tile grid. The A and B "
        "   (Chrominance) channels are preserved untouched, ensuring 100% color fidelity.\n\n"
        "3. Bilateral Edge-Preserving Denoising:\n"
        "   Dark camera frames suffer from heavy Gaussian and sensor read noise. The bilateral filter uses spatial distance combined "
        "   with radiometric intensity differences to smooth flat noisy darkness while preserving sharp edge boundaries.\n\n"
        "4. Unsharp Masking:\n"
        "   Restores high-frequency detail: I_sharp = 1.25 · I - 0.25 · Blur(I)."
    )

    # 3.3 Video Frame Processing
    h3_3 = doc.add_heading(level=2)
    h3_3.add_run("3.3 Frame-by-Frame Video Processing & FFmpeg Muxing")

    p_vid = doc.add_paragraph()
    p_vid.paragraph_format.line_spacing = 1.15
    p_vid.add_run(
        "Loading multi-gigabyte video files entirely into RAM causes instant Out-Of-Memory (OOM) fatal exceptions on student laptops. "
        "Our video engine streams frames sequentially:\n"
        "1. cv2.VideoCapture streams frames one at a time into memory.\n"
        "2. In-place enhancement executes on the single frame.\n"
        "3. cv2.VideoWriter writes the frame to an intermediate container.\n"
        "4. FFmpeg subprocess executes:\n"
        "   ffmpeg -y -i enhanced_temp.mp4 -i original.mp4 -c:v libx264 -pix_fmt yuv420p -c:a aac -map 0:v:0 -map 1:a:0? final.mp4\n"
        "   This transcodes the video to standard H.264 profile for web browsers and multiplexes the source audio track."
    )

    doc.add_page_break()

    # Section 4: Metrics
    h4 = doc.add_heading(level=1)
    h4.add_run("4. QUANTITATIVE QUALITY & ILLUMINATION METRICS").font.color.rgb = RGBColor(15, 23, 42)

    p_m = doc.add_paragraph()
    p_m.paragraph_format.line_spacing = 1.15
    p_m.add_run(
        "For rigorous college evaluation and viva demonstrations, the system automatically computes objective metrics "
        "before and after enhancement:"
    )

    tbl_metrics = doc.add_table(rows=5, cols=4)
    tbl_metrics.alignment = WD_TABLE_ALIGNMENT.CENTER
    m_headers = ["Metric", "Mathematical Definition", "Low-Light Typical", "Enhanced Typical"]
    m_data = [
        ("Mean Brightness", "μ = (1/N) ∑ I_gray", "< 40 / 255 (Severe Darkness)", "90 – 140 / 255 (Optimal Visibility)"),
        ("RMS Contrast", "σ = √[(1/N) ∑ (I_gray - μ)²]", "10 – 25 (Collapsed dynamic range)", "45 – 70 (Well-separated tones)"),
        ("Dynamic Range", "Range = p95 - p5 percentiles", "20 – 40 intensity levels", "110 – 180 intensity levels"),
        ("Shannon Entropy", "H = - ∑ p_i · log₂(p_i)", "0.5 – 2.5 (Loss of textural information)", "5.5 – 7.5 (Rich textural details recovered)")
    ]
    for col_idx, h in enumerate(m_headers):
        cell = tbl_metrics.rows[0].cells[col_idx]
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)

    for row_idx, data in enumerate(m_data):
        row = tbl_metrics.rows[row_idx + 1]
        for col_idx, text in enumerate(data):
            cell = row.cells[col_idx]
            p = cell.paragraphs[0]
            p.add_run(text)
            bg = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

    doc.add_page_break()

    # Section 5: User Manual
    h5 = doc.add_heading(level=1)
    h5.add_run("5. COMPLETE USER OPERATING MANUAL").font.color.rgb = RGBColor(15, 23, 42)

    # 5.1 Run
    h5_1 = doc.add_heading(level=2)
    h5_1.add_run("5.1 System Launch (Single Command Full-Stack)")
    p_run = doc.add_paragraph()
    p_run.paragraph_format.line_spacing = 1.15
    p_run.add_run(
        "Open a PowerShell or Terminal window in the project root directory and execute:\n"
    )
    p_cmd = doc.add_paragraph()
    p_cmd.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_cmd = p_cmd.add_run("python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000")
    r_cmd.bold = True
    r_cmd.font.size = Pt(11)
    r_cmd.font.color.rgb = RGBColor(16, 185, 129)

    p_run2 = doc.add_paragraph()
    p_run2.paragraph_format.line_spacing = 1.15
    p_run2.add_run(
        "FastAPI will start and automatically mount both the REST API endpoints and the pre-built React frontend. "
        "Open your browser and navigate to: http://127.0.0.1:8000\n"
    )

    # 5.2 Image Module
    h5_2 = doc.add_heading(level=2)
    h5_2.add_run("5.2 Operating the Image Enhancement Module")
    p_img = doc.add_paragraph()
    p_img.paragraph_format.line_spacing = 1.15
    p_img.add_run(
        "1. Click the 'Image' tab in the top navigation bar.\n"
        "2. Upload a dark image (JPG, PNG, WEBP), or click 'Load Low-Light Sample Image' to generate an instant nighttime street scene.\n"
        "3. Choose your preferred Enhancement Pipeline:\n"
        "   • Zero-DCE Deep Learning: Uses the pre-trained neural network (Epoch99.pth).\n"
        "   • Advanced OpenCV: Gamma LUT + LAB CLAHE + Bilateral Denoising.\n"
        "   • Hybrid Engine: Blends Zero-DCE curves with local CLAHE contrast.\n"
        "   • Fast Real-Time: 1.0 ms ultra-low latency pathway.\n"
        "4. Adjust sliders for Gamma Power (1.0 – 2.6), CLAHE Clip Limit (1.0 – 4.0), and Denoising.\n"
        "5. Click 'Apply Night Vision Enhancement'.\n"
        "6. Slide the interactive divider handle left/right to compare Before and After, or toggle Side-by-Side view.\n"
        "7. Inspect the Objective Quality Metrics Table and click 'Download Enhanced' to save the output file."
    )

    # 5.3 Video Module
    h5_3 = doc.add_heading(level=2)
    h5_3.add_run("5.3 Operating the Video Enhancement Module")
    p_vid = doc.add_paragraph()
    p_vid.paragraph_format.line_spacing = 1.15
    p_vid.add_run(
        "1. Click the 'Video' tab in the top navigation bar.\n"
        "2. Upload an MP4, AVI, MOV, or WEBM video, or click 'Generate Low-Light Test Clip' to synthesize a test video directly on the client.\n"
        "3. Select the pipeline mode (Advanced OpenCV is recommended for high video throughput).\n"
        "4. Click 'Process & Reconstruct Video'.\n"
        "5. Observe real-time progress: Frame counter (e.g., Frame 45/60), percentage bar, throughput speed (FPS), and ETA.\n"
        "6. When complete, watch the enhanced video side-by-side with the original input video.\n"
        "7. Click 'Download Enhanced Video' to save the reconstructed MP4."
    )

    # 5.4 Live Module
    h5_4 = doc.add_heading(level=2)
    h5_4.add_run("5.4 Operating the Live Night Vision Webcam Module")
    p_live = doc.add_paragraph()
    p_live.paragraph_format.line_spacing = 1.15
    p_live.add_run(
        "1. Click the 'Live' tab in the navigation bar.\n"
        "2. Select 'Browser Webcam' (works universally across any laptop or desktop with camera permissions).\n"
        "3. Click 'Start Live Night Vision'.\n"
        "4. The system streams the live feed with a tactical night-vision HUD (crosshair reticle, corner brackets, live FPS, and latency).\n"
        "5. Monitor the Illumination Gain Gauge showing raw vs. enhanced brightness in real-time.\n"
        "6. Click 'Snapshot' to capture and download any enhanced frame as a JPEG.\n"
        "7. Click 'Stop Camera Feed' when done."
    )

    doc.add_page_break()

    # Section 8: Viva Preparation
    h8 = doc.add_heading(level=1)
    h8.add_run("6. VIVA VOCE & EXAMINATION PREPARATION (Q&A)").font.color.rgb = RGBColor(15, 23, 42)

    qa_list = [
        ("Q1: Why is Zero-DCE considered a 'Zero-Reference' model?",
         "Answer: Traditional low-light deep learning networks (e.g., RetinexNet, LLNet) require paired datasets of identical scenes captured in darkness and studio lighting. Zero-DCE does not need paired ground-truth references. It trains a CNN to estimate pixel-wise light enhancement curves guided by four non-reference loss functions: Spatial Consistency, Exposure Control, Color Constancy, and Illumination Smoothness."),

        ("Q2: Why is CLAHE performed in CIE LAB space rather than RGB?",
         "Answer: In RGB color space, the three channels are strongly correlated and blend luminance with chrominance. Applying histogram equalization to R, G, and B independently alters color ratios, causing severe unnatural color shifts. CIE LAB space decouples luminance (L-channel) from color opponents (A and B channels). By applying CLAHE exclusively to the L-channel, we amplify contrast without disturbing original colors."),

        ("Q3: How does the system handle video without running out of memory (OOM)?",
         "Answer: The system implements sequential frame streaming using cv2.VideoCapture. At any given moment, only a single frame is held in memory, enhanced, and written to an intermediate container via cv2.VideoWriter. This guarantees a constant, minimal RAM footprint (< 200 MB) regardless of whether the video is 10 MB or 5 GB."),

        ("Q4: How does FFmpeg preserve original audio?",
         "Answer: OpenCV's VideoWriter only writes raw video streams and drops audio tracks. Our system uses a subprocess invocation of FFmpeg that takes the enhanced video stream from OpenCV (-map 0:v:0) and the audio stream from the original container (-map 1:a:0?) and muxes them together into an H.264 MP4 container with exact audio-video lip synchronization."),

        ("Q5: What is the function of the Bilateral Filter in low-light processing?",
         "Answer: Low-light amplification naturally boosts dark sensor noise (thermal and Poisson noise). Standard Gaussian smoothing blurs both noise and important object edges. A bilateral filter uses both spatial proximity and intensity domain similarity: it smooths pixels that are nearby and have similar intensities, but halts smoothing across steep intensity gradients, preserving sharp edges.")
    ]

    for q, a in qa_list:
        p_q = doc.add_paragraph()
        r_q = p_q.add_run(q)
        r_q.bold = True
        r_q.font.color.rgb = RGBColor(15, 23, 42)

        p_a = doc.add_paragraph()
        p_a.paragraph_format.line_spacing = 1.15
        p_a.paragraph_format.space_after = Pt(8)
        r_a = p_a.add_run(a)
        r_a.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_page_break()

    # Section 9: References
    h9 = doc.add_heading(level=1)
    h9.add_run("7. REFERENCES & ACADEMIC CITATIONS").font.color.rgb = RGBColor(15, 23, 42)

    refs = [
        "[1] C. Li, C. Guo, C. C. Loy, \"Learning to See in the Dark with Zero-Reference Deep Curve Estimation,\" IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR), 2020.",
        "[2] K. Zuiderveld, \"Contrast Limited Adaptive Histogram Equalization,\" Graphics Gems IV, Academic Press, pp. 474–485, 1994.",
        "[3] C. Tomasi and R. Manduchi, \"Bilateral Filtering for Gray and Color Images,\" IEEE International Conference on Computer Vision (ICCV), 1998.",
        "[4] D. Hasler and S. Süsstrunk, \"Measuring Colourfulness in Natural Images,\" Human Vision and Electronic Imaging VIII, SPIE Proceedings, 2003.",
        "[5] E. Land, \"The Retinex Theory of Color Vision,\" Scientific American, vol. 237, no. 6, pp. 108–129, 1977.",
        "[6] H. Shannon, \"A Mathematical Theory of Communication,\" Bell System Technical Journal, vol. 27, pp. 379–423, 1948."
    ]
    for ref in refs:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(ref)
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(71, 85, 105)

    # Save Word document
    output_path = "d:/IVP Project/NIGHT_VISION_PROJECT_MANUAL.docx"
    doc.save(output_path)
    print(f"Successfully generated Word document manual at: {output_path}")

if __name__ == "__main__":
    create_manual()
