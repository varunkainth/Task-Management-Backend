// routes/task.js
import express from 'express';
import TokenVerify from '../middleware/TokenVerification.js';
import AdminCheck from '../middleware/CheckAdmin.js';
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
} from '../controller/Task.js';
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js';

const router = express.Router();

// Create a new task (Requires authentication)
router.post('/tasks', TokenVerify, CreateTask);

// Get all tasks with optional filters (Requires authentication)
router.get('/tasks', TokenVerify, async (req, res) => {
  try {
    const cacheKey = 'allTasks';
    const cachedTasks = await getCachedValue(cacheKey);

    if (cachedTasks) {
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await getAllTask(req, res);

    await cacheValue(cacheKey, JSON.stringify(tasks), 3600); // Cache for 1 hour
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Tasks List Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get details of a specific task (Requires authentication)
router.get('/tasks/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `task:${id}`;
    const cachedTask = await getCachedValue(cacheKey);

    if (cachedTask) {
      return res.status(200).json(JSON.parse(cachedTask));
    }

    const task = await getTaskDetails(req, res);

    await cacheValue(cacheKey, JSON.stringify(task), 3600); // Cache for 1 hour
    res.status(200).json(task);
  } catch (error) {
    console.error('Task Details Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a task (Requires authentication)
router.put('/tasks/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    await getUpdateTask(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`task:${id}`);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('Update Task Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a task (Requires authentication and possibly admin role)
router.delete('/tasks/:id', TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTask(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`task:${id}`);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Other task routes...

export default router;
