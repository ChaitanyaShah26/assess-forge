import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('CRITICAL ERROR: MONGODB_URI environment variable is missing.');
  process.exit(1);
}

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      autoIndex: true,
    });
    console.log(`MongoDB Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    setTimeout(connectDB, 5000);
  }
};