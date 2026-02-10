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
        // Current SDK v3 doesn't support extremely long-term presigned URLs well in browser
        // but we can generate them for 7 days (max in many configs) or as configured.
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        try {
            return await getSignedUrl(s3Client, command, { expiresIn });
        } catch (error) {
            console.error('S3 Presign Error:', error);
            throw error;
        }
    }
};
