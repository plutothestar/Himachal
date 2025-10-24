// utils/cloudinaryConfig.ts

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { File } from 'formidable';

cloudinary.config({
  // cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  // api_key: process.env.CLOUDINARY_API_KEY!,
  // api_secret: process.env.CLOUDINARY_API_SECRET!,
   cloud_name: 'dbz2jdivm', 
        api_key: '674534746127641', 
        api_secret: 'HKlVMj0C735Bqc_txoP7T6d38cI'
});

// utils/cloudinaryConfig.ts
export const uploadImage = (file: File, folder: string): Promise<any> => {
  if (!file?.filepath) {
    return Promise.reject(new Error('Invalid file object'));
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file.filepath, {
      folder: folder, // Dynamic folder based on asset type
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
};

export function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.split('?')[0]; // Remove query params
  const parts = cleanUrl.split('/upload/');
  if (parts.length < 2) return null;

  let publicIdWithExtension = parts[1];
  publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, ''); // Remove version folder
  return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove file extension
}