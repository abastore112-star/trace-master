import { ProcessingOptions } from "../types/types";

/**
 * Service to handle high-quality ML processing on a cloud server (Hugging Face)
 */
class MLCloudService {
    private static instance: MLCloudService;
    private hfToken: string | null = null;
    private spaceUrl: string | null = null;

    private constructor() {
        // Default to environment variable if user hasn't set custom URL
        const defaultUrl = import.meta.env.VITE_CLOUD_HQ_URL || '';
        this.hfToken = localStorage.getItem('tm_hf_token');
        this.spaceUrl = localStorage.getItem('tm_cloud_url') || defaultUrl;

        // If we have a default URL and user hasn't set one, save it
        if (defaultUrl && !localStorage.getItem('tm_cloud_url')) {
            localStorage.setItem('tm_cloud_url', defaultUrl);
        }
    }

    public static getInstance(): MLCloudService {
        if (!MLCloudService.instance) {
            MLCloudService.instance = new MLCloudService();
        }
        return MLCloudService.instance;
    }

    public setConfig(url: string, token?: string) {
        // Normalize URL: Convert UI URL to Direct App URL
        // From: https://huggingface.co/spaces/user/name
        // To: https://user-name.hf.space
        let normalizedUrl = url.trim();
        if (normalizedUrl.includes('huggingface.co/spaces/')) {
            const parts = normalizedUrl.split('huggingface.co/spaces/')[1].split('/');
            if (parts.length >= 2) {
                const user = parts[0];
                const space = parts[1];
                normalizedUrl = `https://${user}-${space}.hf.space`;
            }
        }

        this.spaceUrl = normalizedUrl;
        localStorage.setItem('tm_cloud_url', normalizedUrl);
        if (token) {
            this.hfToken = token;
            localStorage.setItem('tm_hf_token', token);
        }
    }

    private isProcessing = false;
    private lastRequestTime = 0;
    private readonly COOLDOWN_MS = 2000;
    private requestQueue: Promise<any> = Promise.resolve();

    public async processImage(
        canvas: HTMLCanvasElement,
        modelType: 'anime' | 'realistic' = 'anime',
        outputFormat: 'webp' | 'svg' = 'webp'
    ): Promise<{ image: string; svg?: string } | null> {
        // Wrap the logic in a queue to ensure serial execution
        return this.requestQueue = this.requestQueue.then(async () => {
            return this.executeWithRetry(canvas, modelType, outputFormat);
        });
    }

    private async executeWithRetry(
        canvas: HTMLCanvasElement,
        modelType: 'anime' | 'realistic',
        outputFormat: 'webp' | 'svg',
        retryCount = 0
    ): Promise<{ image: string; svg?: string } | null> {
        if (!this.spaceUrl) {
            console.error('MLCloudService: No Cloud URL configured');
            return null;
        }

        // 1. Enforce Cooldown
        const now = Date.now();
        const timeSinceLast = now - this.lastRequestTime;
        if (timeSinceLast < this.COOLDOWN_MS) {
            await new Promise(resolve => setTimeout(resolve, this.COOLDOWN_MS - timeSinceLast));
        }

        try {
            this.isProcessing = true;

            // Convert canvas to blob
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return null;

            const formData = new FormData();
            formData.append('file', blob, 'image.png');
            formData.append('model_type', modelType);
            formData.append('output_format', outputFormat);

            const endpoint = this.spaceUrl.endsWith('/') ? `${this.spaceUrl}process` : `${this.spaceUrl}/process`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.hfToken ? { 'Authorization': `Bearer ${this.hfToken}` } : {},
                body: formData
            });

            // 2. Handle Throttling (429) or Service Unavailable (503)
            if ((response.status === 429 || response.status === 503) && retryCount < 3) {
                const backoffDelay = Math.pow(2, retryCount) * 1000;
                console.warn(`MLCloudService: Server busy (${response.status}). Retrying in ${backoffDelay}ms... (Attempt ${retryCount + 1}/3)`);
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
                return this.executeWithRetry(canvas, modelType, outputFormat, retryCount + 1);
            }

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cloud Inference Failed: ${error}`);
            }

            const result = await response.json();
            this.lastRequestTime = Date.now();
            return {
                image: result.image,
                svg: result.svg
            };
        } catch (err) {
            console.error('MLCloudService Error:', err);
            return null;
        } finally {
            this.isProcessing = false;
        }
    }
}

export const mlCloudService = MLCloudService.getInstance();
