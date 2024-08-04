import redis from 'redis';

const client = redis.createClient({
  url: 'redis://localhost:6379'
});

client.on('error', (err) => {
  console.error('Redis error:', err);
});

// Connect to Redis and handle potential connection errors
const connectRedis = async () => {
   if (client.isOpen) {
    console.log('Redis client is already connected.');
    return;
   }
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Error connecting to Redis:', err);
    process.exit(1); // Exit the process if connection fails
  }
};

// Call connectRedis to ensure connection is established before using the client
connectRedis();

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
process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing Redis client...');
  await client.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing Redis client...');
  await client.quit();
  process.exit(0);
});

export { client, cacheValue, getCachedValue, deleteCachedValue };
