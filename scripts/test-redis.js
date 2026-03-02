import { connectRedis, disconnectRedis } from '../src/config/redis.js';
import redisClient from '../src/config/redis.js';

const testRedis = async () => {
    console.log('Testing Redis connection...');
    await connectRedis();

    try {
        await redisClient.set('test-key', 'Hello Redis');
        const value = await redisClient.get('test-key');
        console.log('Redis test value:', value);

        if (value === 'Hello Redis') {
            console.log('Redis test PASSED');
        } else {
            console.error('Redis test FAILED: Value mismatch');
        }
    } catch (error) {
        console.error('Redis test FAILED:', error);
    } finally {
        await disconnectRedis();
    }
};

testRedis();
