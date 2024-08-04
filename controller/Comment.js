import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// Create a new comment
export const createComment = async (req, res) => {
  try {
    const { taskId, userId, content } = req.body;

    if (!taskId || !userId || !content) {
      return res.status(400).json({ message: "Task ID, User ID, and content are required" });
    }

    // Verify if the task and user exist
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create and save the new comment
    const newComment = new Comment({
      taskId,
      userId,
      content,
    });

    const savedComment = await newComment.save();

    res.status(201).json({
      message: "Comment created successfully",
      comment: savedComment,
    });
  } catch (error) {
    console.error("Create Comment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get a single comment by ID
export const getCommentById = async (req, res) => {
  try {
    const commentId = req.params.id;

    const comment = await Comment.findById(commentId)
      .populate("taskId", "title") // Only fetch the title of the task
      .populate("userId", "name"); // Only fetch the name of the user

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json(comment);
  } catch (error) {
    console.error("Get Comment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all comments for a task
export const getCommentsByTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Use pagination to manage performance with large datasets
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ taskId })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name"); // Fetch only the user name

    res.status(200).json(comments);
  } catch (error) {
    console.error("Get Comments by Task Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const { content } = req.body;

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true } // Return the updated document
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Update Comment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
