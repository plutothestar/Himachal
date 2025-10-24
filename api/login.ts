import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { handleCors } from '../utils/authentication';

const ADMIN_PASSWORD = 'TestPassword123!';
const JWT_SECRET = 'rwegr';

export default function handler(req: VercelRequest, res: VercelResponse) {
    if (handleCors(req, res)) return;
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: '30m' });

    return res.status(200).json({ token });
}
