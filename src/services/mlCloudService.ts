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

    public async processImage(
        canvas: HTMLCanvasElement,
        modelType: 'anime' | 'realistic' = 'anime',
        outputFormat: 'webp' | 'svg' = 'webp'
    ): Promise<{ image: string; svg?: string } | null> {
        if (!this.spaceUrl) {
            console.error('MLCloudService: No Cloud URL configured');
            return null;
        }

        try {
            // Ensure the canvas is prepared for readback
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            // Convert canvas to blob
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) return null;

            const formData = new FormData();
            formData.append('file', blob, 'image.png');
            formData.append('model_type', modelType);
            formData.append('output_format', outputFormat);

            // Call the cloud API
            const endpoint = this.spaceUrl.endsWith('/') ? `${this.spaceUrl}process` : `${this.spaceUrl}/process`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: this.hfToken ? { 'Authorization': `Bearer ${this.hfToken}` } : {},
                body: formData
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cloud Inference Failed: ${error}`);
            }

            const result = await response.json();
            return {
                image: result.image,
                svg: result.svg
            };
        } catch (err) {
            console.error('MLCloudService Error:', err);
            return null;
        }
    }
}

export const mlCloudService = MLCloudService.getInstance();
