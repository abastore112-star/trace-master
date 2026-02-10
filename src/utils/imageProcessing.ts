
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

  // Calculate variance
  let sumLum = 0;
  let sumSqLum = 0;
  let colorDiff = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = (r + g + b) / 3;
    sumLum += lum;
    sumSqLum += lum * lum;

    // Sum of differences between channels (colorfulness)
    colorDiff += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
  }

  const count = data.length / 4;
  const avgLum = sumLum / count;
  const avgColorDiff = colorDiff / (count * 3);
  const stdDev = Math.sqrt(sumSqLum / count - avgLum * avgLum);

  // Heuristics:
  // stdDev < 40: Likely a clean sketch or low-contrast line art.
  // stdDev > 75: Likely a complex photograph.
  // avgColorDiff > 15: Likely a colored photo (even if clean)

  let suggestedThreshold = 45;
  let suggestedEdgeStrength = 40;

  // Enhanced sketch detection:
  // 1. High brightness (white background)
  // 2. Low luminance variance
  // 3. LOW color variance (sketches are usually grayscale)

  // A sketch is bright, has low texture variance, and low color variance
  let isSketch = stdDev < 45 && avgLum > 170 && avgColorDiff < 15;

  // If it's a dark photo OR highly textured, it's NOT a sketch
  if (stdDev > 60 || avgLum < 100) isSketch = false;

  if (isSketch) {
    // Clean sketch: Be sensitive to find thin lines
    suggestedThreshold = 30;
    suggestedEdgeStrength = 25;
  } else if (stdDev > 75) {
    // Busy photo: Be selective to avoid noise
    suggestedThreshold = 65;
    suggestedEdgeStrength = 55;
  }

  // Adjust for overall brightness
  if (avgLum < 80) suggestedThreshold -= 10;
  if (avgLum > 180) suggestedThreshold += 5;

  // Determine if it's a "Perfect Sketch" (High contrast, clean lines, white background)
  // Check if most pixels are either very bright or very dark
  let extremePixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    if (l > 240 || l < 15) extremePixels++;
  }
  const extremeRatio = extremePixels / pixels;

  // A perfect sketch has > 85% extreme pixels (lines are usually < 15% of page)
  const isPerfectSketch = isSketch && extremeRatio > 0.85 && avgLum > 200;

  return {
    threshold: Math.max(10, Math.min(140, suggestedThreshold)),
    edgeStrength: Math.max(10, Math.min(140, suggestedEdgeStrength)),
    contrast: 100,
    brightness: 100,
    invert: avgLum < 100,
    blend: 0,
    isSketch,
    isPerfectSketch
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

export const MAX_IMAGE_DIM = 1280; // Reduced for low-end device stability (Samsung J7 safe-zone)

export const applyFilters = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  options: ProcessingOptions
) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
    const ratio = Math.min(MAX_IMAGE_DIM / width, MAX_IMAGE_DIM / height);
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

/**
 * Removes white backgrounds from sketches instantly
 */
export const applyAutoTransparency = (canvas: HTMLCanvasElement, threshold: number = 220) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is near white, make it transparent
    if (r > threshold && g > threshold && b > threshold) {
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Flood-fills an area with transparency starting from (x, y)
 */
export const magicEraser = (canvas: HTMLCanvasElement, startX: number, startY: number, tolerance: number = 30) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  const getPixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const setPixelTransparent = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    data[idx + 3] = 0; // Alpha to 0
  };

  const targetColor = getPixel(startX, startY);
  if (targetColor[3] === 0) return; // Already transparent

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const color = getPixel(x, y);
    const diff = Math.abs(color[0] - targetColor[0]) +
      Math.abs(color[1] - targetColor[1]) +
      Math.abs(color[2] - targetColor[2]);

    if (diff <= tolerance && color[3] > 0) {
      setPixelTransparent(x, y);
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

/**
 * Specifically designed for Cloud HQ output (which often has gray/textured backgrounds).
 * Distills only the strongest lines and makes everything else perfectly transparent.
 */
export const distillCloudLines = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;

  // 1. More Robust Background Sampling
  // Sample small grids in corners and center of edges
  const samplePoints = [
    { x: 10, y: 10 }, { x: width - 10, y: 10 },
    { x: 10, y: height - 10 }, { x: width - 10, y: height - 10 },
    { x: Math.floor(width / 2), y: 10 }, { x: Math.floor(width / 2), y: height - 10 }
  ];

  let bgR = 0, bgG = 0, bgB = 0;
  let count = 0;

  samplePoints.forEach(p => {
    // Sample a 3x3 grid around each point
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = p.x + dx;
        const y = p.y + dy;
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const idx = (y * width + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
          count++;
        }
      }
    }
  });

  bgR /= count;
  bgG /= count;
  bgB /= count;

  // 2. Adaptive Extraction
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Euclidean distance
    const diff = Math.sqrt(
      Math.pow(r - bgR, 2) +
      Math.pow(g - bgG, 2) +
      Math.pow(b - bgB, 2)
    );

    // More sensitive threshold (25) to catch pencil strokes
    if (diff > 25) {
      // It's a line - Force to pure black for high-fidelity projection
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    } else {
      // It's background - make perfectly transparent
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
