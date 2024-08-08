import express from 'express';
import TokenVerify from '../middleware/TokenVerification.js';
import AdminCheck from '../middleware/CheckAdmin.js';
import {
  createSubTask,
  getSubTaskDetails,
  getAllSubTask,
  updateSubTask,
  deleteSubTask,
  addAttachmentsToSubTask,
  removeAttachmentFromSubTask
} from '../controller/SubTask.js';
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js';
import upload from '../middleware/multer.js'; // Assuming you have a multer middleware

const router = express.Router();

// Create a sub-task with file attachments (Requires authentication)
router.post('/tasks/:id/subtasks', TokenVerify, upload.array('files'), async (req, res) => {
  try {
    const newSubTask = await createSubTask(req, res);

    // Invalidate the cache for the specific task's sub-tasks list
    await deleteCachedValue(`subtasks:task:${req.params.id}`);

    res.status(201).json(newSubTask);
  } catch (error) {
    console.error('Error creating sub-task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get details of a sub-task (Requires authentication)
router.get('/subtasks/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `subtask:${id}`;
    const cachedSubTask = await getCachedValue(cacheKey);

    if (cachedSubTask) {
      return res.status(200).json(JSON.parse(cachedSubTask));
    }

    const subTask = await getSubTaskDetails(req, res);

    await cacheValue(cacheKey, JSON.stringify(subTask), 3600); // Cache for 1 hour
    res.status(200).json(subTask);
  } catch (error) {
    console.error('Error fetching sub-task details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all sub-tasks for a specific task (Requires authentication)
router.get('/tasks/:id/subtasks', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `subtasks:task:${id}`;
    const cachedSubTasks = await getCachedValue(cacheKey);

    if (cachedSubTasks) {
      return res.status(200).json(JSON.parse(cachedSubTasks));
    }

    const subTasks = await getAllSubTask(req, res);

    await cacheValue(cacheKey, JSON.stringify(subTasks), 3600); // Cache for 1 hour
    res.status(200).json(subTasks);
  } catch (error) {
    console.error('Error fetching sub-tasks for task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a sub-task (Requires authentication)
router.put('/subtasks/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSubTask = await updateSubTask(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`subtask:${id}`);
    await deleteCachedValue(`subtasks:task:${req.body.taskId}`); // Invalidate the list cache

    res.status(200).json(updatedSubTask);
  } catch (error) {
    console.error('Error updating sub-task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a sub-task (Requires authentication and possibly admin role)
router.delete('/subtasks/:id', TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSubTask = await deleteSubTask(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`subtask:${id}`);
    await deleteCachedValue(`subtasks:task:${req.body.taskId}`); // Invalidate the list cache

    res.status(200).json({ message: 'Sub-task deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub-task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add attachments to a sub-task (Requires authentication)
router.patch('/subtasks/:id/attachments', TokenVerify, upload.array('files'), async (req, res) => {
  try {
    const updatedSubTask = await addAttachmentsToSubTask(req, res);

    // Invalidate cache for the updated sub-task
    await deleteCachedValue(`subtask:${req.params.id}`);

    res.status(200).json(updatedSubTask);
  } catch (error) {
    console.error('Error adding attachments to sub-task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Remove an attachment from a sub-task (Requires authentication and possibly admin role)
router.delete('/subtasks/:subtaskId/attachments/:attachmentId', TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { subtaskId, attachmentId } = req.params;
    const updatedSubTask = await removeAttachmentFromSubTask(req, res);

    // Invalidate cache for the updated sub-task
    await deleteCachedValue(`subtask:${subtaskId}`);

    res.status(200).json(updatedSubTask);
  } catch (error) {
    console.error('Error removing attachment from sub-task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
