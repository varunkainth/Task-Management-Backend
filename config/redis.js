import { createClient } from 'redis';
import dotenv from "dotenv"
dotenv.config()

// Configuration for Redis connection on Render
const redisConfig = {
  url: process.env.REDIS_URL,
};

// Create a Redis client
const client = createClient(redisConfig);

// Connect to Redis server
client.on('connect', () => {
  console.log('Connected to Redis server');
});

client.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Handle reconnection logic
client.on('reconnecting', () => {
  console.log('Reconnecting to Redis server...');
});

/**
 * Cache a value in Redis
 * @param {string} key - The key under which the value should be stored
 * @param {string} value - The value to be stored
 * @param {number} [expiry] - Optional expiry time in seconds
 */
const cacheValue = async (key, value, expiry) => {
  try {
    if (expiry) {
      await client.set(key, value, { EX: expiry });
      console.log(`Value cached with key: ${key} and expiry: ${expiry} seconds`);
    } else {
      await client.set(key, value);
      console.log(`Value cached with key: ${key}`);
    }
  } catch (err) {
    console.error(`Error caching value for key ${key}:`, err);
  }
};

/**
 * Get a cached value from Redis
 * @param {string} key - The key of the cached value
 * @returns {Promise<string|null>} - The cached value or null if not found
 */
const getCachedValue = async (key) => {
  try {
    const result = await client.get(key);
    console.log(`Cached value retrieved for key: ${key}`);
    return result;
  } catch (err) {
    console.error(`Error getting cached value for key ${key}:`, err);
    throw err;
  }
};

/**
 * Delete a cached value from Redis
 * @param {string} key - The key of the cached value to delete
 */
const deleteCachedValue = async (key) => {
  try {
    const result = await client.del(key);
    if (result === 1) {
      console.log(`Cached value deleted for key: ${key}`);
    } else {
      console.log(`No cached value found for key: ${key}`);
    }
  } catch (err) {
    console.error(`Error deleting cached value for key ${key}:`, err);
  }
};

// Export the client and functions for use in other parts of the application
export {
  client,
  cacheValue,
  getCachedValue,
  deleteCachedValue,
};
