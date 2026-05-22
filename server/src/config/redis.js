import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('CRITICAL ERROR: REDIS_URL environment variable is missing.');
  process.exit(1);
}

const redisOptions = {
  maxRetriesPerRequest: null, 
  enableReadyCheck: false,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.slice(0, targetError.length) === targetError) {
      return true;
    }
    return false;
  }
};

let redisConnection;

try {
  redisConnection = new Redis(REDIS_URL, redisOptions);
  
  redisConnection.on('connect', () => {
    console.log('Redis Cache connection established successfully.');
  });

  redisConnection.on('error', (err) => {
    console.error('Redis encountered an execution error:', err);
  });
} catch (error) {
  console.error('Failed to initialize Redis connector client:', error);
}

export { redisConnection };