import redis from 'redis';

// Initialize Redis client
const client = redis.createClient({
  url: "redis://127.0.0.1:6379"

});

// Error handling
client.on('error', (err) => {
  console.error('Redis error:', err);
});

// Connect to Redis and handle potential connection errors
const connectRedis = async () => {
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('Connected to Redis');
    } catch (err) {
      console.error('Error connecting to Redis:', err);
      process.exit(1);
    }
  }
};



// Call connectRedis to ensure connection is established before using the client
connectRedis();

// Caching functions
const cacheValue = async (key, value, expiration = 3600) => {
  try {
    await client.set(key, value, 'EX', expiration);
  } catch (err) {
    console.error('Error caching value:', err);
  }
};

const getCachedValue = async (key) => {
  try {
    return await client.get(key);
  } catch (err) {
    console.error('Error retrieving cached value:', err);
  }
};

const deleteCachedValue = async (key) => {
  try {
    await client.del(key);
  } catch (err) {
    console.error('Error deleting cached value:', err);
  }
};

// Graceful shutdown of the Redis client
const shutdown = async () => {
  console.log('Shutting down Redis client...');
  try {
    await client.quit();
  } catch (err) {
    console.error('Error quitting Redis client:', err);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { client, cacheValue, getCachedValue, deleteCachedValue };
