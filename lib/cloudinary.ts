// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer to Cloudinary
 * @param buffer - Image buffer from file upload
 * @param folder - Cloudinary folder to organize uploads (e.g., 'products', 'blogs', 'gallery')
 * @param filename - Optional custom filename
 * @returns Cloudinary secure URL
 */
export async function uploadToCloudinary(
    buffer: Buffer,
    folder: string,
    filename?: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadOptions: any = {
            folder: `joy-juncture/${folder}`,
            resource_type: 'auto',
        };

        if (filename) {
            uploadOptions.public_id = filename;
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('Upload failed - no result returned'));
                }
            }
        );

        uploadStream.end(buffer);
    });
}

/**
 * Delete an image from Cloudinary using its URL
 * @param imageUrl - Full Cloudinary URL
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
    try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/cloud/image/upload/v123/joy-juncture/products/abc.jpg
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');

        if (uploadIndex === -1) {
            console.warn('Not a Cloudinary URL, skipping deletion:', imageUrl);
            return;
        }

        // Get everything after 'upload/v{version}/'
        const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

        await cloudinary.uploader.destroy(publicId);
        console.log('Deleted from Cloudinary:', publicId);
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Don't throw - deletion errors shouldn't break the flow
    }
}

export default cloudinary;
