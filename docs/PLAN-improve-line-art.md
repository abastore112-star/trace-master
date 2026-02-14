# Plan: Improve Line Art Service (Precision & Vectorization)

**Goal:** Transform the current "noisy" image-to-line-art service into a high-precision, clean, vector-based (SVG) generation tool suitable for users to trace/cut.

## User Review Required
> [!IMPORTANT]
> **Action Required:** You will need to **deploy the updated Python code** to your Hugging Face Space manually after I generate it. I cannot deploy to your cloud directly.

## Proposed Changes

### 1. Backend (Python/Hugging Face)
The current pipeline is `Image -> LineartDetector -> VTracer`. The noise comes from the detector picking up texture and VTracer maintaining those small details.

**Improvements:**
*   **Pre-processing:** Add **CLAHE (Contrast Limited Adaptive Histogram Equalization)** and **Gaussian Blur** to the input image to smooth out paper grain/noise before the AI sees it.
*   **Better Detector:** Switch `LineartDetector` logic. If `coarse=True` is too rough, we will try `coarse=False` but with cleaner input. Alternatively, explore `AnimeLineartPreprocessor` if available in the library, or stick to robust `Lineart`.
*   **Denoising (Critical):** Apply **OpenCV Morphological Operations** (Opening/Closing) on the *output* of the AI model to remove "dust" and "grains" (small disconnected pixels).
*   **Contour Filtering:** Remove small contours (speckles) based on area size.
*   **VTracer Tuning:**
    *   Increase `filter_speckle` (4 -> 64) to ignore grains.
    *   Increase `corner_threshold` (60 -> 45) for smoother curves (less jagged).
    *   Change `mode` to `spline` (already is, but ensure optimal precision).

### 2. Frontend (React/TypeScript)
*   **`src/services/mlCloudService.ts`**: Update to support potential new parameters (if we decide to expose "Smoothness" or "Detail Level" to the user later).
*   **`src/utils/imageProcessing.ts`**: Ensure the image sent to the cloud is not pre-processed clumsily by the client (send raw-ish image).

## Phase 1: Python Backend Optimization (The Core Fix)
We will rewrite your `app.py` to include a simpler but stronger standard CV pipeline *around* the AI.

#### [MODIFY] `app.py` (Your HF File)
*   Add `clean_image_input()` function (Denoise input).
*   Add `post_process_lines()` function (Remove small specs/grains from AI output).
*   Update `vtracer` config for "Plotter/Cutter" grade SVG (super clean paths).

## Phase 2: Frontend Integration
#### [MODIFY] `src/services/mlCloudService.ts`
*   No major breaking changes, just validation to ensure we display the SVG correctly.

## Verification Plan

### Manual Verification
1.  **Deploy Backend:** You paste the new `app.py` code to Hugging Face.
2.  **Test:** Upload a grainy photo of a sketch.
3.  **Check:**
    *   Are the grains gone?
    *   Is the SVG composed of long, smooth paths (good) or thousands of tiny dots (bad)?
