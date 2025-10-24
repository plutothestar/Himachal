import { Document, Model, Schema } from 'mongoose';
import connectToDatabase from '../db/db';
import getModel from '../db/models/model';  

// Create data in any collection
export const createData = async <T extends Document>(
  dbName: string,
  collectionName: string,
  Model: Model<T>,
  data: Omit<T, '_id'> 
): Promise<T> => {
  try {
    await connectToDatabase(dbName);

    const document = new Model(data);
    await document.save();
    console.log(`Document inserted into ${collectionName}`);
    return document;
  } catch (error) {
    console.error(`Error inserting into ${collectionName}:`, error);
    throw new Error('Error inserting data');
  }
};
// Get data from any collection
export const getData = async <T extends Document>(
  dbName: string,
  collectionName: string,
  schemaDefinition: object,
  query: object
): Promise<T[]> => {
  try {
    await connectToDatabase(dbName); // Connect to the database dynamically

    const Model = getModel<T>(dbName, collectionName, schemaDefinition); // Get the correct model
    const data = await Model.find(query);
    return data;
  } catch (error) {
    console.error(`Error getting data from ${collectionName}:`, error);
    throw new Error('Error fetching data');
  }
};

// Update data in any collection
export const updateData = async <T extends Document>(
  dbName: string,
  collectionName: string,
  schemaDefinition: object,
  query: object,
  update: object
): Promise<any> => {
  try {
    await connectToDatabase(dbName); // Connect to the database dynamically

    const Model = getModel<T>(dbName, collectionName, schemaDefinition); // Get the correct model
    const result = await Model.updateOne(query, update);
    return result;
  } catch (error) {
    console.error(`Error updating data in ${collectionName}:`, error);
    throw new Error('Error updating data');
  }
};

// Delete data from any collection
export const deleteData = async <T extends Document>(
  dbName: string,
  collectionName: string,
  schemaDefinition: object,
  query: object
): Promise<any> => {
  try {
    await connectToDatabase(dbName); // Connect to the database dynamically

    const Model = getModel<T>(dbName, collectionName, schemaDefinition); // Get the correct model
    const result = await Model.deleteOne(query);
    return result;
  } catch (error) {
    console.error(`Error deleting data from ${collectionName}:`, error);
    throw new Error('Error deleting data');
  }
};

// Count data in any collection
export const countData = async <T extends Document>(
  dbName: string,
  collectionName: string,
  schemaDefinition: object,
  query: object
): Promise<number> => {
  try {
    await connectToDatabase(dbName); // Connect to the database dynamically

    const Model = getModel<T>(dbName, collectionName, schemaDefinition); // Get the correct model
    const count = await Model.countDocuments(query);
    return count;
  } catch (error) {
    console.error(`Error counting data in ${collectionName}:`, error);
    throw new Error('Error counting data');
  }
};
