'use strict';

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * ASSET SERVICE
 * 
 * Handles uploading and retrieving public/private assets from cloud storage.
 */
class AssetService {
    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        this.bucket = process.env.ASSETS_BUCKET || 'cloudiverse-assets';
        this.cdnBase = process.env.CDN_BASE_URL || ''; // If empty, use direct S3 URLs
    }

    /**
     * Upload an asset to S3
     */
    async uploadAsset(key, body, contentType, isPublic = true) {
        console.log(`[ASSET] Uploading ${key} (${contentType})`);
        
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            });

            await this.s3Client.send(command);
            return this.getPublicUrl(key);
        } catch (err) {
            console.warn(`[ASSET] S3 Upload failed for ${key}. Falling back to Data URI.`, err.message);
            // Fallback: Return data URI for local/dev use
            const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
            const base64 = buffer.toString('base64');
            return `data:${contentType};base64,${base64}`;
        }
    }

    /**
     * Get the public URL for an asset
     */
    getPublicUrl(key) {
        if (this.cdnBase) {
            return `${this.cdnBase}/${key}`;
        }
        return `https://${this.bucket}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    }

    /**
     * Get a signed URL for a private asset
     */
    async getSignedUrl(key, expiresSeconds = 3600) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn: expiresSeconds });
    }
}

module.exports = new AssetService();
