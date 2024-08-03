import express from "express";
import {
  createSubTask,
  getSubTaskDetails,
  getAllSubTask,
  updateSubTask,
  deleteSubTask,
  addAttachmentsToSubTask,
  removeAttachmentFromSubTask,
} from "../controller/SubTask.js";

const router = express.Router();

router.post("/tasks/:id/subtasks", createSubTask); // Create a new sub-task
router.get("/subtasks/:id", getSubTaskDetails); // Get details of a specific sub-task
router.get("/tasks/:id/subtasks", getAllSubTask); // Get all sub-tasks for a specific task
router.put("/subtasks/:id", updateSubTask); // Update a specific sub-task
router.delete("/subtasks/:id", deleteSubTask); // Delete a specific sub-task
router.post("/subtasks/:id/attachments", addAttachmentsToSubTask); // Add attachments to a sub-task
router.delete(
  "/subtasks/:subtaskId/attachments/:attachmentId",
  removeAttachmentFromSubTask
); // Remove an attachment from a sub-task

export default router;
