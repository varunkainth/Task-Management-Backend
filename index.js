import app from "./app.js";
import DataBaseConnection from "./config/DbConnection.js";
import dotenv from "dotenv";
import { client as redisClient } from "./config/redis.js"; // Import Redis client

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await DataBaseConnection();
    // Ensure Redis is connected
    await redisClient.connect();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error while connecting to the database or Redis:", err);
    process.exit(1); // Exit the process with an error code
  }
};

startServer();
