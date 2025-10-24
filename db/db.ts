import mongoose from 'mongoose';

const connectToDatabase = async (dbName: string) => {
  if (mongoose.connections[0].readyState) {
    return; // already connected
  }

 const uri = process.env.MONGO_URI as string; 

  try {
    await mongoose.connect(uri, {
      dbName: dbName, 
    });
    console.log(`Connected to the ${dbName} database`);
  } catch (error) {
    console.error(`Error connecting to the ${dbName} database:`, error);
    throw new Error(`Failed to connect to ${dbName} database`);
  }
};

export default connectToDatabase;
