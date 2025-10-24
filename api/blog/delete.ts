// delete.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Content } from '../../db/models/content';
import connectToDatabase from '../../db/db';
import { handleCors, verifyAdminToken } from '../../utils/authentication';
import { v2 as cloudinary } from 'cloudinary';
import { getPublicIdFromUrl } from '../../utils/cloudinaryConfig';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (handleCors(req, res)) return;

  try {
    verifyAdminToken(req);
  } catch (error: any) {
    return res.status(401).json({ status: 'error', message: error.message });
  }

  if (req.method === 'DELETE') {
    const { contentId } = req.query;

    await connectToDatabase('HimaCms');

    try {
      // Find content first to get the Cloudinary public_id
      const content = await Content.findById(contentId);
      if (!content) {
        return res.status(404).json({
          status: 'error',
          message: 'Content not found',
          error: `No content found with ID: ${contentId}`,
        });
      }
   var publicId = await getPublicIdFromUrl(content.banner_image_url);
      // If blog has a banner_image_public_id, delete from Cloudinary
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
          console.log('Deleted image from Cloudinary:', publicId);
        } catch (cloudErr: any) {
          console.error('Failed to delete image from Cloudinary:', cloudErr.message);
        }
      }

      // Now delete from DB
      const deletedContent = await Content.findByIdAndDelete(contentId);

      return res.status(200).json({
        status: 'success',
        message: 'Content and associated image deleted successfully',
        data: deletedContent,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete content',
        error: error.message,
      });
    }
  } else {
    return res.status(405).json({
      status: 'error',
      message: 'Method not allowed',
    });
  }
};
