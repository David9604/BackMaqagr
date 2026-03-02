import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create a Redis client instance but don't connect automatically if lazyConnect is true
// ioredis connects automatically by default.
let redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('error', (err) => {
  // Suppress error logging during tests if connection is expected to fail or be mocked
  if (process.env.NODE_ENV !== 'test') {
    console.error('Redis client error:', err);
  }
});

export const connectRedis = async () => {
  if (redisClient.status === 'ready') return;
  try {
    await redisClient.connect();
    console.log('Redis connection verified');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis client disconnected');
  }
};

export default redisClient;
