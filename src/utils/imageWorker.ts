
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

    // 3. Final Blending & De-noising
    for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);

        // EXCEPTION: If it is a "Perfect Sketch", bypass Sobel processing to avoid grains and preserve original fidelity
        // Just use the grayscale value as the line art directly
        if (options.isPerfectSketch) {
            const val = grayscale[i / 4];
            if (options.blend === 0) {
                // Trace mode: High-fidelity mapping
                // Use the original grayscale as a multiplier for the stroke color
                const cVal = options.invert ? 255 : 0;
                data[i] = cVal;
                data[i + 1] = cVal;
                data[i + 2] = cVal;

                // Alpha mapping: Darker pixels (in non-inverted) become more opaque
                // We use a slightly more generous mapping than 1-bit thresholding to preserve anti-aliasing
                let alpha = options.invert ? (val > 128 ? (val - 128) * 2 : 0) : (255 - val);

                // For "Perfect Sketches", we really want it to look EXACTLY like the original 
                // but with a transparent background.
                data[i + 3] = Math.max(0, Math.min(255, alpha));
            } else {
                data[i] = data[i + 1] = data[i + 2] = val;
                data[i + 3] = 255;
            }
            continue;
        }

        const edge = sobelData[i / 4];
        let isLine = edge > threshold;

        // Simple De-noise: Check if it's an isolated pixel
        if (isLine && x > 0 && x < width - 1 && y > 0 && y < height - 1) {
            const idx = i / 4;
            const neighbors =
                (sobelData[idx - 1] > threshold ? 1 : 0) +
                (sobelData[idx + 1] > threshold ? 1 : 0) +
                (sobelData[idx - width] > threshold ? 1 : 0) +
                (sobelData[idx + width] > threshold ? 1 : 0);

            if (neighbors < 1) isLine = false; // Isolated noise removal
        }

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

    // 4. Handle Magic Eraser
    if (options.specialAction === 'magicEraser' && options.startX !== undefined && options.startY !== undefined) {
        const startX = options.startX;
        const startY = options.startY;
        const tolerance = options.tolerance || 30;
        const width = imageData.width;
        const height = imageData.height;

        const getPixelIdx = (x: number, y: number) => (y * width + x) * 4;

        const startIdx = getPixelIdx(startX, startY);
        const targetR = data[startIdx];
        const targetG = data[startIdx + 1];
        const targetB = data[startIdx + 2];
        const targetA = data[startIdx + 3];

        if (targetA > 0) {
            const stack: [number, number][] = [[startX, startY]];
            const visited = new Uint8Array(width * height);

            while (stack.length > 0) {
                const [x, y] = stack.pop()!;
                if (x < 0 || x >= width || y < 0 || y >= height) continue;

                const idx = y * width + x;
                if (visited[idx]) continue;
                visited[idx] = 1;

                const pIdx = idx * 4;
                const r = data[pIdx];
                const g = data[pIdx + 1];
                const b = data[pIdx + 2];
                const a = data[pIdx + 3];

                const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);

                if (diff <= tolerance && a > 0) {
                    data[pIdx + 3] = 0;
                    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
                }
            }
        }
    }

    // Return the processed data
    (self as any).postMessage({ imageData }, [imageData.data.buffer]);
};
