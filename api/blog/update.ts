import { v2 as cloudinary } from 'cloudinary';
import { parseForm } from '../../utils/parseForm';
import { uploadImage } from '../../utils/cloudinaryConfig';
import connectToDatabase from '../../db/db';
import { Content } from '../../db/models/content';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors, verifyAdminToken } from '../../utils/authentication';

export const config = {
  api: { bodyParser: false },
};

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
  
  if (handleCors(req, res)) return;
if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  try {
    verifyAdminToken(req);
  } catch (error) {
    return res.status(401).json({ status: 'error', message: error.message });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  const { contentId } = req.query;

  try {
    const { fields, files } = await parseForm(req);

    const normalize = (field: any) => Array.isArray(field) ? field[0] : field;

    const contentType = normalize(fields.contentType);
    const title = normalize(fields.title);
    const author = normalize(fields.author);
    const publication_date = normalize(fields.publication_date);
    const content = normalize(fields.content);
    const tags = normalize(fields.tags)?.split(',').map((tag: string) => tag.trim()) || [];

    const updateFields = { contentType, title, author, publication_date, content, tags };
    const missingFields = Object.entries(updateFields).filter(([_, val]) => !val).map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
        missingFields,
      });
    }

    // Connect to DB and fetch the content
    await connectToDatabase('HimaCms');
    const existingContent = await Content.findById(contentId);

    if (!existingContent) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found',
        error: `No content found with ID: ${contentId}`,
      });
    }

    let banner_image_url = existingContent.banner_image_url;

    const banner_image = files.banner_image;
    const file = Array.isArray(banner_image) ? banner_image[0] : banner_image;

    if (file && file.filepath) {
      // Determine the folder dynamically (for example, 'blogs' or 'testimonials')
      let folderPath = 'blogs'; // Default folder path
      if (contentType === 'testimonial') {
        folderPath = 'testimonials'; // For testimonials, save images in the testimonials folder
      }

      // Delete previous image from Cloudinary if it exists
      const previousPublicId = getPublicIdFromUrl(existingContent.banner_image_url);
      if (previousPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId);
        } catch (error) {
          console.error('Failed to delete old image from Cloudinary:', error);
          // Not critical - proceed anyway
        }
      }

      // Upload new image to the dynamically chosen folder
      const uploadResult = await uploadImage(file, folderPath);
      banner_image_url = uploadResult.secure_url;
    }

    // Update the content in the database with new values
    const updatedContent = await Content.findByIdAndUpdate(
      contentId,
      {
        ...updateFields, // Update fields like contentType, title, etc.
        banner_image_url, // Update the banner image URL
      },
      { new: true } // Return the updated document after the update
    );

    if (!updatedContent) {
      return res.status(404).json({
        status: 'error',
        message: 'Content not found after update',
        error: `No content found with ID: ${contentId}`,
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Content updated successfully',
      data: updatedContent,
    });
  } catch (error: any) {
    console.error('Error in PUT handler:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Server error',
      error: error.message,
    });
  }
}
