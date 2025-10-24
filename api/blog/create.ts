// api/blog/create.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
// import formidable, { File,IncomingForm } from 'formidable';
import { parseForm } from '../../utils/parseForm';
import { Content } from '../../db/models/content';
import { uploadImage } from '../../utils/cloudinaryConfig';
import connectToDatabase from '../../db/db'; // Ensure DB is connected
import { handleCors, verifyAdminToken } from '../../utils/authentication';
// Disable body parser for multipart/form-data
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async (req: VercelRequest, res: VercelResponse) => {

    if (handleCors(req, res)) return;
    if (req.method === 'OPTIONS') return res.status(200).end();


    try {
        verifyAdminToken(req);
    } catch (error: any) {
        return res.status(401).json({ status: 'error', message: error.message });
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ status: 'error', message: 'Method not allowed' });
    }

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

    let banner_image_url = '';

    const banner_image = files.banner_image;
    const file = Array.isArray(banner_image) ? banner_image[0] : banner_image;

    let folderPath = 'blogs'; // Default to 'blogs' folder
    if (fields.contentType === 'testimonial') {
        folderPath = 'testimonials'; // Set to 'testimonials' folder for testimonial assets
    }

    if (file && file.filepath) {
        // Upload image to Cloudinary in the dynamically chosen folder
        try {
            const withTimeout = (promise, ms = 10000) =>
                Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out')), ms))
                ]);

            const uploadResult = await withTimeout(uploadImage(file, folderPath), 10000);

            banner_image_url = uploadResult.secure_url; // URL of the uploaded image in Cloudinary
        } catch (error: any) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to upload image',
                error: error.message,
            });
        }
    }

    try {
        // Connect to DB
        await connectToDatabase('HimaCms');
        const imageUrl = banner_image_url;

        // Ensure tags is an array
        const tagsArray =
            typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;

        const newContent = new Content({
            contentType,
            title,
            author,
            publication_date: new Date(publication_date as string),
            banner_image_url: imageUrl,
            content,
            tags: tagsArray,
        });

        await newContent.save();

        return res.status(201).json({
            status: 'success',
            message: 'Content created successfully',
            data: newContent,
        });
    } catch (error: any) {
        console.error('Create error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to create content',
            error: error.message,
        });
    }
};