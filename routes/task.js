import express from 'express';
import TokenVerify from '../middleware/TokenVerification.js';
import AdminCheck from '../middleware/CheckAdmin.js';
import upload from '../middleware/multer.js'; // Assuming you have a multer middleware
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
  removeAttachmentFromTask
} from '../controller/Task.js';
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js';

const router = express.Router();

// Create a new task
router.post('/create', TokenVerify, upload.array('files'), async (req, res) => {
  try {
    await CreateTask(req, res);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('CREATE TASK Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all tasks with optional filters
router.get('/get-all', TokenVerify, async (req, res) => {
  try {
    const { priority, dueDate, projectId, sortBy, page = 1, limit = 10 } = req.query;
    const cacheKey = `tasks:filters:${priority || 'all'}:${dueDate || 'all'}:${projectId || 'all'}:${sortBy || 'createdAt'}:${page}:${limit}`;
    const cachedTasks = await getCachedValue(cacheKey);

    if (cachedTasks) {
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await getAllTask(req, res);

    await cacheValue(cacheKey, JSON.stringify(tasks), 3600); // Cache for 1 hour
    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET ALL TASK Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get details of a specific task
router.get('/:id', TokenVerify, async (req, res) => {
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
    console.error('GET TASK DETAILS Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a task
router.put('/update/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    await getUpdateTask(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`task:${id}`);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('UPDATE TASK Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a task
router.delete('/delete/:id', TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteTask(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`task:${id}`);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('DELETE TASK Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Assign a task to a user
router.post('/users/assign/:userId/:id', TokenVerify, async (req, res) => {
  try {
    await assignTask(req, res);
    await deleteCachedValue(`task:${req.params.id}`);
    await deleteCachedValue(`tasks:user:${req.params.userId}`); // Invalidate the user tasks cache
  } catch (error) {
    console.error('ASSIGN TASK Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update task status
router.patch('/update-status/:id', TokenVerify, async (req, res) => {
  try {
    await updateStatus(req, res);
    await deleteCachedValue(`task:${req.params.id}`);
    await deleteCachedValue('allTasks'); // Invalidate the list cache
  } catch (error) {
    console.error('UPDATE STATUS Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get tasks assigned to a user
router.get('/users/assign/:userId', TokenVerify, async (req, res) => {
  try {
    const { userId } = req.params;
    const cacheKey = `tasks:user:${userId}`;
    const cachedTasks = await getCachedValue(cacheKey);

    if (cachedTasks) {
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await getTaskByUser(req, res);

    await cacheValue(cacheKey, JSON.stringify(tasks), 3600); // Cache for 1 hour
    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET TASK BY USER Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get tasks for a specific project
router.get('/projects/:projectId', TokenVerify, async (req, res) => {
  try {
    const { projectId } = req.params;
    const cacheKey = `tasks:project:${projectId}`;
    const cachedTasks = await getCachedValue(cacheKey);

    if (cachedTasks) {
      return res.status(200).json(JSON.parse(cachedTasks));
    }

    const tasks = await getTaskByProject(req, res);

    await cacheValue(cacheKey, JSON.stringify(tasks), 3600); // Cache for 1 hour
    res.status(200).json(tasks);
  } catch (error) {
    console.error('GET TASK BY PROJECT Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add attachments to a task
router.patch('/attachments/add/:id', TokenVerify, upload.array('files'), async (req, res) => {
  try {
    await addAttachmentsToTask(req, res);
    await deleteCachedValue(`task:${req.params.id}`);
  } catch (error) {
    console.error('ADD ATTACHMENTS Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Remove an attachment from a task
router.delete('/attachments/remove/:attachmentId/:id', TokenVerify, AdminCheck, async (req, res) => {
  try {
    await removeAttachmentFromTask(req, res);
    await deleteCachedValue(`task:${req.params.id}`);
  } catch (error) {
    console.error('REMOVE ATTACHMENT Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
