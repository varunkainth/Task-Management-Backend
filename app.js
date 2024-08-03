import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Express Middle Ware
app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// HomePage
app.get("/", (req, res) => {
  res.send("Welcome to the API of Task Management Sysytem ");
});

//Other Routes

import UserRoutes from "./routes/user.js";
import AuthRoutes from "./routes/auth.js";
import TaskRoutes from "./routes/task.js";
import ProjectRoutes from "./routes/project.js";


app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/projects", ProjectRoutes);


export default app;
