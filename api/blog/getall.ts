import { VercelRequest, VercelResponse } from '@vercel/node';
import { Content } from '../../db/models/content';  // Import Content model
import connectToDatabase from '../../db/db';   // Import DB connection

export default async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        await connectToDatabase('HimaCms');

        try {
            const blogs = await Content.find();

            if (blogs.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'No blogs found',
                });
            }

            return res.status(200).json({
                status: 'success',
                message: 'Blogs fetched successfully',
                data: blogs,
            });
        } catch (error) {
            console.error('Error fetching blogs:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch blogs',
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

