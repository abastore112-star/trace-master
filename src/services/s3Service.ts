import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
    endpoint: import.meta.env.VITE_S3_ENDPOINT,
    region: import.meta.env.VITE_S3_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_S3_ACCESS_KEY || '',
        secretAccessKey: import.meta.env.VITE_S3_SECRET_KEY || '',
    },
    forcePathStyle: true, // Required for many S3-compatible providers
});

const BUCKET_NAME = import.meta.env.VITE_S3_BUCKET_NAME;

// In-memory cache for presigned URLs
interface CacheEntry {
    url: string;
    expiresAt: number;
}

const URL_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL = 4 * 60 * 1000; // 4 minutes (URLs valid for 7 days, cache for safety)

export const s3Service = {
    async uploadImage(file: Blob, path: string): Promise<string> {
        try {
            // Convert Blob to Uint8Array to avoid 'readableStream.getReader' error in browser
            const arrayBuffer = await file.arrayBuffer();
            const body = new Uint8Array(arrayBuffer);

            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: path,
                Body: body,
                ContentType: file.type || 'image/png',
            });

            await s3Client.send(command);
            return path; // Return the key
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw error;
        }
    },

    async getPresignedUrl(key: string, expiresIn = 3600 * 24 * 7): Promise<string> {
        // Check cache first
        const cached = URL_CACHE.get(key);
        const now = Date.now();

        if (cached && cached.expiresAt > now) {
            return cached.url;
        }

        // Generate new presigned URL
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        try {
            const url = await getSignedUrl(s3Client, command, { expiresIn });

            // Cache it (expires 1 minute before URL actually expires for safety)
            URL_CACHE.set(key, {
                url,
                expiresAt: now + CACHE_TTL
            });

            // Periodically clean up expired entries to prevent memory leaks
            if (URL_CACHE.size > 100) {
                for (const [cachedKey, entry] of URL_CACHE.entries()) {
                    if (entry.expiresAt <= now) {
                        URL_CACHE.delete(cachedKey);
                    }
                }
            }

            return url;
        } catch (error) {
            console.error('S3 Presign Error:', error);
            throw error;
        }
    },

    /**
     * Clear the entire URL cache (useful for debugging or manual refresh)
     */
    clearCache() {
        URL_CACHE.clear();
    },

    /**
     * Get cache statistics (useful for monitoring)
     */
    getCacheStats() {
        const now = Date.now();
        let valid = 0;
        let expired = 0;

        for (const entry of URL_CACHE.values()) {
            if (entry.expiresAt > now) {
                valid++;
            } else {
                expired++;
            }
        }

        return {
            totalEntries: URL_CACHE.size,
            validEntries: valid,
            expiredEntries: expired
        };
    }
};
