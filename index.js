import app from "./app.js";
import DataBaseConnection from "./config/DbConnection.js";
import dotenv from "dotenv";
import { client as redisClient } from "./config/redis.js"; // Import Redis client

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to the database
    await DataBaseConnection();
    console.log('Database connected');

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log('Connected to Redis');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log('Redis URL:', process.env.REDIS_URL);
    });
  } catch (err) {
    console.error("Error while connecting to the database or Redis:", err);
    process.exit(1); // Exit the process with an error code
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  try {
    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    console.log('Redis client disconnected');
    
    // Close database connection
    await DataBaseConnection.close(); // Assuming you have a close method
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
