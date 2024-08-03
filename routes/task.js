import express from "express";
import {
  CreateTask,
  getAllTask,
  getTaskDetails,
  getUpdateTask,
  deleteTask,
  assignTask,
  updateStatus,
  getTaskByUser,
  getTaskByProject,
  addAttachmentsToTask,
  removeAttachmentFromTask,
} from "../controller/Task.js"; 
const router = express.Router();

// Route to create a new task
router.post("/", CreateTask);

// Route to get all tasks with optional filters
router.get("/", getAllTask);

// Route to get details of a specific task by ID
router.get("/:id", getTaskDetails);

// Route to update a specific task by ID
router.put("/:id", getUpdateTask);

// Route to delete a specific task by ID
router.delete("/:id", deleteTask);

// Route to assign a task to a user
router.put("/:id/assign/:userId", assignTask);

// Route to update the status of a specific task
router.put("/:id/status", updateStatus);

// Route to get tasks assigned to a specific user
router.get("/user/:userId", getTaskByUser);

// Route to get tasks associated with a specific project
router.get("/project/:projectId", getTaskByProject);

// Route to add attachments to a task
router.put("/:id/attachments", addAttachmentsToTask);

// Route to remove an attachment from a task
router.delete("/:taskId/attachments/:attachmentId", removeAttachmentFromTask);

export default router;
