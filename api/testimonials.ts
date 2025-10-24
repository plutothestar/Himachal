import { VercelRequest, VercelResponse } from '@vercel/node';
import { parseForm } from '../utils/parseForm';
import { uploadImage } from '../utils/cloudinaryConfig'; // Function to upload to Cloudinary
import { handleCors, verifyAdminToken } from '../utils/authentication';
import { v2 as cloudinary } from 'cloudinary';// Import cloudinary for delete operation

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to get the public ID from Cloudinary URL
function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.split('?')[0]; // Remove query params
  const parts = cleanUrl.split('/upload/');
  if (parts.length < 2) return null;

  let publicIdWithExtension = parts[1];
  publicIdWithExtension = publicIdWithExtension.replace(/^v\d+\//, ''); // Remove version folder
  return publicIdWithExtension.replace(/\.[^/.]+$/, ''); // Remove file extension
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS handling
  if (handleCors(req, res)) return;

  // Token verification
  

  // Handle different methods (GET, POST, DELETE)
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return await getAllTestimonialImages(req, res);
  }

  if (req.method === 'POST') {
    return await addTestimonialImage(req, res);
  }

  if (req.method === 'DELETE') {
    return await deleteTestimonialImage(req, res);
  }

  return res.status(405).json({ status: 'error', message: 'Method not allowed' });
}

// Get all testimonial images
async function getAllTestimonialImages(req: VercelRequest, res: VercelResponse) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'testimonials/', // The folder for testimonials
    });
    
    const images = result.resources.map((image: any) => ({
      url: image.secure_url,
      public_id: image.public_id,
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Testimonial images fetched successfully',
      data: images,
    });
  } catch (error:any) {
    console.error('Error fetching images from Cloudinary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch testimonial images',
      error: error.message,
    });
  }
}

// Add a new testimonial image
async function addTestimonialImage(req: VercelRequest, res: VercelResponse) {
  const { files } = await parseForm(req);
  const banner_image = files.banner_image;
  const file = Array.isArray(banner_image) ? banner_image[0] : banner_image;

  if (!file || !file.filepath) {
    return res.status(400).json({
      status: 'error',
      message: 'No image uploaded',
    });
  }

  // Upload the image to Cloudinary in the 'testimonials' folder
  try {
    const uploadResult = await uploadImage(file, 'testimonials');
    return res.status(201).json({
      status: 'success',
      message: 'Testimonial image added successfully',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });
  } catch (error:any) {
    console.error('Error uploading image to Cloudinary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to upload image',
      error: error.message,
    });
  }
}

// Delete a testimonial image
async function deleteTestimonialImage(req: VercelRequest, res: VercelResponse) {
  const { public_id } = req.query;

  if (!public_id) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing public_id for the image to delete',
    });
  }

  try {
    // Delete image from Cloudinary using the public_id
    await cloudinary.uploader.destroy(public_id as string);
    return res.status(200).json({
      status: 'success',
      message: 'Testimonial image deleted successfully',
    });
  } catch (error:any) {
    console.error('Error deleting image from Cloudinary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete image from Cloudinary',
      error: error.message,
    });
  }
}
