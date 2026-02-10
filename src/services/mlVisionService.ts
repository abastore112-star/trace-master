
import * as ort from 'onnxruntime-web';

// Initialize ONNX Runtime with WebAssembly
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

let session: ort.InferenceSession | null = null;
let isInitializing = false;

/**
 * Loads the ML model from the public directory
 */
export const initModel = async () => {
    if (session || isInitializing) return;

    isInitializing = true;
    try {
        session = await ort.InferenceSession.create('/model/model.onnx', {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        });
        console.log('TraceMaster: ML Model initialized successfully.');
    } catch (err) {
        console.error('TraceMaster: Failed to load ML model:', err);
    } finally {
        isInitializing = false;
    }
};

/**
 * Processes an image using the ML model to extract natural line art
 */
export const extractNaturalSketch = async (imageCanvas: HTMLCanvasElement): Promise<ImageData | null> => {
    if (!session) {
        await initModel();
        if (!session) return null;
    }

    const ctx = imageCanvas.getContext('2d');
    if (!ctx) return null;

    const width = imageCanvas.width;
    const height = imageCanvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);

    // Pre-process for ML (Normalize to [0, 1] and resize if necessary)
    // The Informative Drawings model usually expects 256x256 or 512x512
    // For now, we assume the model handles variable sizes or we pre-scale
    const modelInputSize = 512;
    const inputTensor = preprocessImage(imageData, modelInputSize);

    try {
        const feeds: Record<string, ort.Tensor> = {};
        feeds[session.inputNames[0]] = inputTensor;

        const results = await session.run(feeds);
        const outputTensor = results[session.outputNames[0]];

        return postprocessTensor(outputTensor, width, height);
    } catch (err) {
        console.error('TraceMaster: ML Inference failed:', err);
        return null;
    }
};

/**
 * Normalizes image data for ONNX input [1, 3, size, size]
 */
function preprocessImage(imageData: ImageData, size: number): ort.Tensor {
    const { data } = imageData;
    const float32Data = new Float32Array(3 * size * size);

    // Optimized normalization
    const pixels = size * size;
    for (let i = 0; i < pixels; i++) {
        const i4 = i * 4;
        float32Data[i] = data[i4] / 255.0;            // R
        float32Data[i + pixels] = data[i4 + 1] / 255.0; // G
        float32Data[i + 2 * pixels] = data[i4 + 2] / 255.0; // B
    }

    return new ort.Tensor('float32', float32Data, [1, 3, size, size]);
}

/**
 * Converts ML output tensor back to ImageData
 */
function postprocessTensor(tensor: ort.Tensor, width: number, height: number): ImageData {
    const data = tensor.data as Float32Array;
    const imageData = new ImageData(width, height);
    const pixels = imageData.data;
    const count = width * height;

    for (let i = 0; i < count; i++) {
        const i4 = i * 4;

        // The ML model output is often grainy/gray. 
        // We apply a steep contrast curve (sigmoid) to clean it up.
        let val = data[i];

        // Denoise/Thresholding logic:
        // Push light grays to white (255), and dark grays to black (0)
        // This eliminates the graininess shown in the user's sample.
        if (val > 0.85) val = 1.0;
        else if (val < 0.3) val = 0.0;
        else {
            // Sigmoid-like contrast boost for the midtones
            val = 1 / (1 + Math.exp(-12 * (val - 0.5)));
        }

        const finalVal = val * 255;
        pixels[i4] = finalVal;
        pixels[i4 + 1] = finalVal;
        pixels[i4 + 2] = finalVal;
        pixels[i4 + 3] = 255;
    }

    // Final Denoise Pass: Remove isolated dark pixels (salt and pepper noise)
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const i4 = (y * width + x) * 4;
            // If pixel is dark but all neighbors are light, it's noise
            if (pixels[i4] < 128) {
                let neighborsLight = 0;
                if (pixels[i4 - 4] > 200) neighborsLight++; // Left
                if (pixels[i4 + 4] > 200) neighborsLight++; // Right
                if (pixels[i4 - width * 4] > 200) neighborsLight++; // Top
                if (pixels[i4 + width * 4] > 200) neighborsLight++; // Bottom

                if (neighborsLight >= 3) {
                    pixels[i4] = 255;
                    pixels[i4 + 1] = 255;
                    pixels[i4 + 2] = 255;
                }
            }
        }
    }

    return imageData;
}
