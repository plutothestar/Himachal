import mongoose, { Schema, Document, Model } from 'mongoose';

const getModel = <T extends Document>(dbName: string, collectionName: string, schemaDefinition: object): Model<T> => {
  // Connect to the database dynamically
  mongoose.connection.useDb(dbName);

  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName] as Model<T>; // Use existing model if it exists
  }

  const schema = new Schema(schemaDefinition);
  return mongoose.model<T>(collectionName, schema); // Create a new model if it doesn't exist
};

export default getModel;
