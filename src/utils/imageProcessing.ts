
import { ProcessingOptions } from "../types/types";

/**
 * Samples the image to determine optimal starting parameters
 */
export const analyzeImageForPresets = (image: HTMLImageElement): Partial<ProcessingOptions> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { threshold: 45, edgeStrength: 40 };

  canvas.width = 120;
  canvas.height = 120;
  ctx.drawImage(image, 0, 0, 120, 120);

  const data = ctx.getImageData(0, 0, 120, 120).data;
  let totalLum = 0;
  let minLum = 255;
  let maxLum = 0;
  const pixels = 120 * 120;

  for (let i = 0; i < data.length; i += 4) {
    const l = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    totalLum += l;
    if (l < minLum) minLum = l;
    if (l > maxLum) maxLum = l;
  }

  const avgLum = totalLum / pixels;

  // Calculate variance to detect "sketchiness" vs "photo"
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    variance += Math.pow(l - avgLum, 2);
  }
  const stdDev = Math.sqrt(variance / pixels);

  // Heuristics:
  // stdDev < 40: Likely a clean sketch or low-contrast line art.
  // stdDev > 70: Likely a complex photograph.

  let suggestedThreshold = 45;
  let suggestedEdgeStrength = 40;

  if (stdDev < 40) {
    // Clean sketch: Be sensitive to find thin lines
    suggestedThreshold = 30;
    suggestedEdgeStrength = 25;
  } else if (stdDev > 75) {
    // Busy photo: Be selective to avoid noise
    suggestedThreshold = 65;
    suggestedEdgeStrength = 55;
  }

  // Adjust for overall brightness
  if (avgLum < 80) suggestedThreshold -= 10; // Dark image needs lower threshold
  if (avgLum > 180) suggestedThreshold += 5; // Very bright image can handle higher

  return {
    threshold: Math.max(10, Math.min(140, suggestedThreshold)),
    edgeStrength: Math.max(10, Math.min(140, suggestedEdgeStrength)),
    contrast: 100,
    brightness: 100,
    invert: avgLum < 100, // Auto-invert for dark images
    blend: 0
  };
};

export const extractPalette = (image: HTMLImageElement): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  canvas.width = 50;
  canvas.height = 50;
  ctx.drawImage(image, 0, 0, 50, 50);

  const data = ctx.getImageData(0, 0, 50, 50).data;
  const colors = new Set<string>();

  for (let i = 0; i < data.length; i += 40) { // Sample points
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    colors.add(hex);
    if (colors.size >= 8) break;
  }

  return Array.from(colors);
};

export const applyFilters = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: ProcessingOptions
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Resolution capping for performance (Max 1920px)
  const MAX_DIM = 1920;
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_DIM || height > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;

  // Clear and draw with base adjustments
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `brightness(${options.brightness}%) contrast(${options.contrast}%)`;
  ctx.drawImage(image, 0, 0);

  if (options.blend < 1) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Grayscale pass
    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
      grayscale[i / 4] = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }

    // Sobel Operator for cleaner edges
    const sobelData = new Uint8ClampedArray(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        // Basic gradient calculation
        const gx = grayscale[idx + 1] - grayscale[idx - 1];
        const gy = grayscale[idx + width] - grayscale[idx - width];
        // Normalize magnitude
        const mag = Math.sqrt(gx * gx + gy * gy) * (options.edgeStrength / 20);
        sobelData[idx] = Math.min(255, mag);
      }
    }

    // Final processing and blending
    for (let i = 0; i < data.length; i += 4) {
      const edge = sobelData[i / 4];
      let lineVal = edge > options.threshold ? 0 : 255;

      if (options.invert) lineVal = 255 - lineVal;

      const alpha = options.blend;
      // In tracing mode (blend 0), we want transparency for non-lines
      if (options.blend === 0) {
        const isLine = edge > options.threshold;
        data[i] = options.invert ? 255 : 0;
        data[i + 1] = options.invert ? 255 : 0;
        data[i + 2] = options.invert ? 255 : 0;
        data[i + 3] = isLine ? 255 : 0;
      } else {
        // Standard mix for visualization
        data[i] = data[i] * alpha + lineVal * (1 - alpha);
        data[i + 1] = data[i + 1] * alpha + lineVal * (1 - alpha);
        data[i + 2] = data[i + 2] * alpha + lineVal * (1 - alpha);
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
};
