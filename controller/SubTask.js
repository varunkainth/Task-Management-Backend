import cloudinary from "../config/Cloudinary.js";
import SubTask from "../models/SubTask.js";
import Task from "../models/Task.js";

// Create a sub-task with file attachments
export const createSubTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, dueDate, priority } = req.body;
    const files = req.files; // `req.files` should contain multiple files

    if (!title || !taskId) {
      return res.status(400).json({ message: "Title and taskId are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const dueDateParsed = dueDate ? new Date(dueDate) : null;

    // Upload files to Cloudinary
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: `Task Management/tasks/${taskId}/subtasks/`,
          use_filename: true,
          unique_filename: false,
        });
        return {
          filename: result.original_filename,
          url: result.secure_url,
          fileType: result.resource_type,
        };
      })
    );

    const newSubTaskData = {
      title,
      description: description || "",
      status: status || "Not Started",
      dueDate: dueDateParsed,
      priority: priority || "Low",
      taskId,
      attachments: uploadedFiles,
    };

    const newSubTask = await SubTask.create(newSubTaskData);

    // Update the related task with the new sub-task ID
    task.subTasks.push(newSubTask._id);
    await task.save();

    res.status(201).json({
      message: "Sub-task created successfully",
      newSubTask,
    });
  } catch (error) {
    console.error("Sub-task Create Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get details of a sub-task
export const getSubTaskDetails = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const subTask = await SubTask.findById(subTaskId).populate("taskId");
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }
    res.status(200).json(subTask);
  } catch (error) {
    console.error("Sub-task Details Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all sub-tasks for a specific task
export const getAllSubTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const subTasks = await SubTask.find({ taskId });
    if (!subTasks.length) {
      return res.status(404).json({ message: "No sub-tasks found" });
    }
    res.status(200).json(subTasks);
  } catch (error) {
    console.error("Sub-task List Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a sub-task
export const updateSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const { title, description, priority, dueDate, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) updateData.status = status;

    const updatedSubTask = await SubTask.findByIdAndUpdate(
      subTaskId,
      updateData,
      { new: true }
    );
    if (!updatedSubTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    res.status(200).json(updatedSubTask);
  } catch (error) {
    console.error("Sub-task Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a sub-task
export const deleteSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const subTask = await SubTask.findById(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    // Optionally, you might want to remove the sub-task reference from the parent task
    await Task.findByIdAndUpdate(subTask.taskId, {
      $pull: { subTasks: subTaskId },
    });

    await subTask.remove();
    res.status(200).json({ message: "Sub-task deleted successfully" });
  } catch (error) {
    console.error("Sub-task Delete Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add attachments to a sub-task
export const addAttachmentsToSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const files = req.files; // `req.files` should contain multiple files

    const subTask = await SubTask.findById(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    // Upload new files to Cloudinary
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: `Task Management/tasks/${subTask.taskId}/subtasks/${subTaskId}`,
          use_filename: true,
          unique_filename: false,
        });
        return {
          filename: result.original_filename,
          url: result.secure_url,
          fileType: result.resource_type,
        };
      })
    );

    subTask.attachments = subTask.attachments.concat(uploadedFiles);

    await subTask.save();
    res.status(200).json(subTask);
  } catch (error) {
    console.error("Sub-task Attachments Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Remove an attachment from a sub-task
export const removeAttachmentFromSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.subtaskId;
    const attachmentId = req.params.attachmentId;

    const subTask = await SubTask.findById(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    const updatedAttachments = subTask.attachments.filter(
      (attachment) => attachment._id.toString() !== attachmentId
    );

    if (updatedAttachments.length === subTask.attachments.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    subTask.attachments = updatedAttachments;
    await subTask.save();

    res.status(200).json(subTask);
  } catch (error) {
    console.error("Remove Attachment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
