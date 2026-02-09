
// Trace Master Image Processing Worker
// Optimized for low-end hardware efficiency

self.onmessage = (e) => {
    const { imageData, options } = e.data;
    const { data, width, height } = imageData;
    const { threshold, edgeStrength, invert, blend, brightness, contrast } = options;

    // 1. Grayscale Pass
    const grayscale = new Uint8ClampedArray(width * height);
    for (let i = 0; i < data.length; i += 4) {
        // Apply basic brightness/contrast adjustments here to avoid double-processing
        // (Simple linear adjustment for speed)
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Grayscale
        grayscale[i / 4] = r * 0.299 + g * 0.587 + b * 0.114;
    }

    // 2. Sobel Edge Detection
    const sobelData = new Uint8ClampedArray(width * height);
    const factor = edgeStrength / 20;

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const gx = grayscale[idx + 1] - grayscale[idx - 1];
            const gy = grayscale[idx + width] - grayscale[idx - width];
            const mag = Math.sqrt(gx * gx + gy * gy) * factor;
            sobelData[idx] = mag > 255 ? 255 : mag;
        }
    }

    // 3. Final Blending
    for (let i = 0; i < data.length; i += 4) {
        const edge = sobelData[i / 4];
        let isLine = edge > threshold;

        // Trace Mode (blend 0) optimization
        if (blend === 0) {
            const val = invert ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
            data[i + 3] = isLine ? 255 : 0;
        } else {
            // Simple blend mode
            const lineVal = isLine ? (invert ? 255 : 0) : (invert ? 0 : 255);
            const alpha = blend;
            const invAlpha = 1 - alpha;

            data[i] = data[i] * alpha + lineVal * invAlpha;
            data[i + 1] = data[i + 1] * alpha + lineVal * invAlpha;
            data[i + 2] = data[i + 2] * alpha + lineVal * invAlpha;
            data[i + 3] = 255;
        }
    }

    // Return the processed data
    (self as any).postMessage({ imageData }, [imageData.data.buffer]);
};
