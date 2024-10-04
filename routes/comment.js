import { Router } from "express";
import {
  createComment,
  deleteComment,
  getCommentById,
  getCommentsByTask,
  updateComment
} from "../controller/Comment.js";
import TokenVerify from "../middleware/TokenVerification.js";
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js'; // Updated import

const router = Router();

// Create a new comment
router.post('/', TokenVerify, async (req, res) => {
  try {
    const newComment = await createComment(req, res);

    // Invalidate the cache for comments related to the task if needed
    if (newComment.taskId) {
      await deleteCachedValue(`task:${newComment.taskId}:comments`);
    }

    res.status(201).json(newComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get a single comment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `comment:${id}`;
    const cachedComment = await getCachedValue(cacheKey);

    if (cachedComment) {
      return res.status(200).json(JSON.parse(cachedComment));
    }

    const comment = await getCommentById(req, res);

    await cacheValue(cacheKey, JSON.stringify(comment), 3600); // Cache for 1 hour
    res.status(200).json(comment);
  } catch (error) {
    console.error('Error fetching comment by ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get all comments for a specific task
router.get('/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const cacheKey = `task:${taskId}:comments`;
    const cachedComments = await getCachedValue(cacheKey);

    if (cachedComments) {
      return res.status(200).json(JSON.parse(cachedComments));
    }

    const comments = await getCommentsByTask(req, res);

    await cacheValue(cacheKey, JSON.stringify(comments), 3600); // Cache for 1 hour
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error fetching comments for task:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Update a comment by ID
router.put('/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedComment = await updateComment(req, res);

    // Invalidate cache for the updated comment
    await deleteCachedValue(`comment:${id}`);

    // Invalidate cache for the task's comments list if needed
    if (updatedComment.taskId) {
      await deleteCachedValue(`task:${updatedComment.taskId}:comments`);
    }

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a comment by ID
router.delete('/:id', TokenVerify, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedComment = await deleteComment(req, res);

    // Invalidate cache for the deleted comment
    await deleteCachedValue(`comment:${id}`);

    // Invalidate cache for the task's comments list if needed
    if (deletedComment.taskId) {
      await deleteCachedValue(`task:${deletedComment.taskId}:comments`);
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

export default router;
