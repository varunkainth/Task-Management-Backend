import app from "./app.js";
import DataBaseConnection from "./config/DbConnection.js";
import dotenv from "dotenv"

dotenv.config()


const PORT = process.env.PORT || 3000;

await DataBaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error while connecting database", err);
  });
