import mongoose from 'mongoose';

const uri = process.env.MONGO_URI as string;
if (!uri) {
  throw new Error("❌ MONGO_URI environment variable not defined");
}

// Global cache to persist the connection between hot reloads and invocations
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export default async function connectToDatabase(dbName: string) {
  // If already connected, reuse the connection
  if (cached.conn) {
    // console.log(`♻️ Using existing MongoDB connection to ${dbName}`);
    return cached.conn;
  }

  if (!cached.promise) {
    // Create a new connection promise
    cached.promise = mongoose
      .connect(uri, { dbName })
      .then((mongooseInstance) => {
        console.log(`✅ Connected to ${dbName} database`);
        return mongooseInstance;
      })
      .catch((err) => {
        console.error(`❌ MongoDB connection error:`, err);
        cached.promise = null; // Reset cache if it fails
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
