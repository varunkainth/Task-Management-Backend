import app from "./app.js";
import {
  DataBaseConnection,
  DataBaseConnectionClose,
} from "./config/DbConnection.js";
import dotenv from "dotenv";
import { client as redisClient } from "./config/redis.js";
import admin from "firebase-admin";
import FirebaseServiceCred from "./config/FireseBaseCred.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to the database
    await DataBaseConnection();
    console.log("Database connected");

    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    console.log("Connected to Redis");

    // Initialize Firebase
    try {
      console.log("Initializing Firebase Admin...");
      admin.initializeApp({
        credential: admin.credential.cert(FirebaseServiceCred),
      });
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
      throw error;
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log("Redis URL:", process.env.REDIS_URL);
    });
  } catch (err) {
    console.error(
      "Error while connecting to the database or Redis or Firebase:",
      err
    );
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
    console.log("Redis client disconnected");

    // Close database connection
    await DataBaseConnectionClose(); // Assuming you have a close method
    console.log("Database connection closed");

    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
