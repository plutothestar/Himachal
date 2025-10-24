// db/models/content.ts

import mongoose, { Document, Schema, model, models } from 'mongoose';

// Define interface without extending Document to avoid union complexity
interface IContent {
  contentType: string;
  title: string;
  author: string;
  publication_date: Date;
  content: string;
  tags: string[];
  banner_image_url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define schema separately
const ContentSchema = new Schema<IContent>(
  {
    contentType: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    publication_date: { type: Date, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    banner_image_url: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Export model with correct types
const Content = models.Content || model<IContent>('Content', ContentSchema);
export { Content, IContent };
