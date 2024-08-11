import mongoose from "mongoose";

const DataBaseConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected");
    console.log("MongoDb Host : ", mongoose.connection.host);
  } catch (err) {
    console.log("DataBase Connection Error :", err);
    process.exit(1);
  }
};

const DataBaseConnectionClose = async () => {
  try {
    await mongoose.disconnect();
    console.log("Database disconnected");
  } catch (err) {
    console.log("DataBase Connection Close Error :", err);
    process.exit(1);
  }
};
export {
  DataBaseConnection,
  DataBaseConnectionClose,
};
