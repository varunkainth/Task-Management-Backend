import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

// Create a new task
export const CreateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, projectId } = req.body;
    const attachments = req.files; // Assuming `req.files` contains multiple files

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const newTaskData = {
      title,
      description: description || "",
      priority: priority || "Medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId || null,
      attachments: [],
    };

    if (attachments && Array.isArray(attachments)) {
      const uploadedAttachments = await Promise.all(attachments.map(async (file) => {
        const result = await cloudinary.v2.uploader.upload(file.path);
        return {
          filename: file.originalname,
          url: result.secure_url,
          fileType: file.mimetype,
        };
      }));

      newTaskData.attachments = uploadedAttachments;
    }

    const newTask = new Task(newTaskData);

    if (projectId) {
      project.tasks.push(newTask._id);
      await project.save();
    }

    const savedTask = await newTask.save();
    res.status(201).json({ message: "Task created successfully", task: savedTask });
  } catch (err) {
    console.error("Task Create Error:", err);
    res.status(500).json({ message: "An error occurred while creating the task." });
  }
};

// Get all tasks with optional filters
export const getAllTask = async (req, res) => {
  try {
    const { priority, dueDate, projectId, sortBy, page = 1, limit = 10 } = req.query;

    const query = {};
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = new Date(dueDate);
    if (projectId) query.projectId = projectId;

    const options = {
      sort: sortBy ? { [sortBy]: 1 } : { createdAt: -1 },
      skip: (page > 0 ? page - 1 : 0) * limit,
      limit: Math.max(parseInt(limit, 10), 1),
      populate: { path: "projectId", select: "name" },
    };

    const tasks = await Task.find(query)
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .populate(options.populate);

    res.status(200).json(tasks);
  } catch (err) {
    console.error("GET ALL TASK Error:", err);
    res.status(500).json({ message: "An error occurred while fetching tasks." });
  }
};

// Get details of a specific task
export const getTaskDetails = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId).populate("projectId");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json(task);
  } catch (err) {
    console.error("GET TASK DETAILS Error:", err);
    res.status(500).json({ message: "An error occurred while fetching task details." });
  }
};

// Update a task
export const getUpdateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const { title, description, priority, dueDate, status } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = new Date(dueDate);
    if (status) task.status = status;
    await task.save();
    res.status(200).json({ message: "Task updated successfully", task: task });
  } catch (err) {
    console.error("UPDATE TASK Error:", err);
    res.status(500).json({ message: "An error occurred while updating task." });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("DELETE TASK Error:", err);
    res.status(500).json({ message: "An error occurred while deleting task." });
  }
};

// Assign a task to a user
export const assignTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.params.userId;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    task.users.push(user._id); // Use an array to allow multiple users
    await task.save();
    res.status(200).json({ message: "Task assigned successfully", task });
  } catch (err) {
    console.error("ASSIGN TASK Error:", err);
    res.status(500).json({ message: "An error occurred while assigning task." });
  }
};
// Update task status
export const updateStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const status = req.body.status;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    task.status = status;
    await task.save();
    res.status(200).json({ message: "Task status updated successfully", task: task });
  } catch (err) {
    console.error("UPDATE STATUS Error:", err);
    res.status(500).json({ message: "An error occurred while updating task status." });
  }
};

// Get tasks assigned to a user
export const getTaskByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const tasks = await Task.find({ users: userId }).populate("users");
    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found for user" });
    }
    res.status(200).json({ tasks });
  } catch (err) {
    console.error("GET TASK BY USER Error:", err);
    res.status(500).json({ message: "An error occurred while fetching tasks." });
  }
};

// Get tasks for a specific project
export const getTaskByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ projectId }).populate("projectId");
    if (!tasks.length) {
      return res.status(404).json({ message: "No tasks found for project" });
    }
    res.status(200).json({ tasks });
  } catch (err) {
    console.error("GET TASK BY PROJECT Error:", err);
    res.status(500).json({ message: "An error occurred while fetching tasks." });
  }
};

// Add attachments to a task
export const addAttachmentsToTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const newAttachments = req.files; // Assuming `req.files` contains multiple files

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (newAttachments && Array.isArray(newAttachments)) {
      const uploadedAttachments = await Promise.all(newAttachments.map(async (file) => {
        const result = await cloudinary.v2.uploader.upload(file.path);
        return {
          filename: file.originalname,
          url: result.secure_url,
          fileType: file.mimetype,
        };
      }));

      task.attachments = task.attachments.concat(uploadedAttachments);
    }

    await task.save();
    res.status(200).json({ message: "Attachments added successfully", task });
  } catch (err) {
    console.error("ADD ATTACHMENTS Error:", err);
    res.status(500).json({ message: "An error occurred while adding attachments." });
  }
};


// Remove an attachment from a task
export const removeAttachmentFromTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachmentId = req.params.attachmentId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const attachment = task.attachments.find(att => att._id.toString() === attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Delete attachment from Cloudinary
    await cloudinary.v2.uploader.destroy(attachment.publicId);

    // Remove attachment from task
    task.attachments = task.attachments.filter(att => att._id.toString() !== attachmentId);

    await task.save();
    res.status(200).json({ message: "Attachment removed successfully", task });
  } catch (err) {
    console.error("REMOVE ATTACHMENT Error:", err);
    res.status(500).json({ message: "An error occurred while removing the attachment." });
  }
};

