import { VercelRequest, VercelResponse } from '@vercel/node';
import {Content} from '../../db/models/content';  // Import Content model
import connectToDatabase from '../../db/db';   // Import DB connection

export default async (req: VercelRequest, res: VercelResponse) => {
     res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();  // Respond to pre-flight request
    }   
    if (req.method === 'GET') {
        const { contentId } = req.query;

        await connectToDatabase('HimaCms');  // Ensure DB connection

        try {
            const content = await Content.findById(contentId);
            if (!content) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Content not found',
                    error: `No content found with ID: ${contentId}`
                });
            }
            return res.status(200).json({
                status: 'success',
                message: 'Content fetched successfully',
                data: content
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch content',
                error: error.message
            });
        }
    } else {
        return res.status(405).json({
            status: 'error',
            message: 'Method not allowed'
        });
    }
};
