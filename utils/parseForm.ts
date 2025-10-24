// utils/parseForm.ts

import { IncomingForm, Fields, Files } from 'formidable';
import { VercelRequest } from '@vercel/node';

export const parseForm = (req: VercelRequest): Promise<{ fields: Fields; files: Files }> => {
  const form = new IncomingForm({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};
