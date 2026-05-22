import mongoose from 'mongoose';
import dns from 'node:dns'; 
import dotenv from 'dotenv';

dotenv.config();

try {
  dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8']); 
  console.log('Forced global public DNS servers for MongoDB SRV resolution.');
} catch (err) {
  console.warn('Could not apply custom DNS servers, using system defaults:', err.message);
}

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