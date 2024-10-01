import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";

const app = express();

// Rate Limiting: Limit the number of requests from a single IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

// Apply rate limiting to all requests
// app.use(limiter);

// Security Middleware
app.use(helmet());
app.use(hpp());

// Compression Middleware
app.use(compression());

app.use(
  cors({
    origin: [
      "*",
      "https://cautious-computing-machine-q9654rrwj74h4p67-3000.app.github.dev",
      "https://solid-journey-w9xq566wq9439rxp-3000.app.github.dev"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Express Middle Ware
app.use(
  express.json({
    limit: "10mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// HomePage
app.get("/", (req, res) => {
  res.send("Welcome to the API of Task Management System");
});

// Import Routes
import UserRoutes from "./routes/user.js";
import AuthRoutes from "./routes/auth.js";
import TaskRoutes from "./routes/task.js";
import ProjectRoutes from "./routes/project.js";
import SubTaskRoutes from "./routes/subTask.js";
import InvitationRoutes from "./routes/invitation.js";
import CommentRoutes from "./routes/comment.js";

// Mount Routes
app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/tasks", TaskRoutes);
app.use("/api/projects", ProjectRoutes);
app.use("/api/subtasks", SubTaskRoutes);
app.use("/api/invitation", InvitationRoutes);
app.use("/api/comments", CommentRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

export default app;
