import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

export const CreateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, projectId, attachments } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const CheckValidProject = await Project.findById(projectId);
    if (!CheckValidProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Create a new task
    const newTaskData = {
      title,
      description: description || "",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      projectId: projectId || null,
    };

    if (attachments && Array.isArray(attachments)) {
      newTaskData.attachments = attachments.map((attachment) => ({
        filename: attachment.filename,
        url: attachment.url,
        fileType: attachment.fileType,
      }));
    }

    const newTask = new Task(newTaskData);

    if (projectId) {
      // Add the task to the project's tasks array
      CheckValidProject.tasks.push(newTask._id);
      await CheckValidProject.save();
    }

    // Save the task
    const savedTask = await newTask.save();

    res.status(201).json({ message: "Task created successfully", task: savedTask });
  } catch (err) {
    console.error("Task Create Error:", err);
    res.status(500).json({ message: "An error occurred while creating the task." });
  }
};


export const getAllTask = async (req, res) => {
  try {
    const {
      priority,
      dueDate,
      projectId,
      sortBy,
      page = 1,
      limit = 10,
    } = req.query;

    // Build the query object
    const query = {};
    if (priority) query.priority = priority;
    if (dueDate) query.dueDate = new Date(dueDate);
    if (projectId) query.projectId = projectId;

    // Build the options for pagination and sorting
    const options = {
      sort: sortBy ? { [sortBy]: 1 } : { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      populate: { path: "projectId", select: "name" },
    };

    // Execute the query with pagination
    const tasks = await Task.find(query)
      .sort(options.sort)
      .skip(options.skip)
      .limit(options.limit)
      .populate(options.populate);

    res.status(200).json(tasks);
  } catch (err) {
    console.error("GET ALL TASK Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while fetching tasks." });
  }
};

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
    res
      .status(500)
      .json({ message: "An error occurred while fetching task details." });
  }
};

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
    if (dueDate) task.dueDate = dueDate;
    if (status) task.status = status;
    await task.save();
    res.status(200).json({ message: "Task updated successfully", task: task });
  } catch (err) {
    console.error("UPDATE TASK Error:", err);
    res.status(500).json({ message: "An error occurred while updating task." });
  }
};

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
    task.users = user._id;
    await task.save();
    res.status(200).json({ message: "Task assigned successfully", task: task });
  } catch (err) {
    console.error("ASSIGN TASK Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while assigning task." });
  }
};

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
    res
      .status(200)
      .json({ message: "Task status updated successfully", task: task });
  } catch (err) {
    console.error("UPDATE STATUS Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while updating task status." });
  }
};

export const getTaskByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const tasks = await Task.find({ users: userId }).populate("users");
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found for user" });
    }
    res.status(200).json({ tasks });
  } catch (err) {
    console.error("GET TASK BY USER Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while fetching tasks." });
  }
};

export const getTaskByProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const tasks = await Task.find({ project: projectId }).populate("project");
    if (!tasks) {
      return res.status(404).json({ message: "No tasks found for project" });
    }
    res.status(200).json({ tasks });
  } catch (err) {
    console.error("GET TASK BY PROJECT Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while fetching tasks." });
  }
};

export const addAttachmentsToTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const newAttachments = req.body.attachments;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (newAttachments && Array.isArray(newAttachments)) {
      task.attachments = task.attachments.concat(newAttachments);
    }

    await task.save();
    
    res.status(200).json(task);
  } catch (error) {
    console.error("Add Attachments Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeAttachmentFromTask = async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const attachmentId = req.params.attachmentId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const updatedAttachments = task.attachments.filter(
      (attachment) => attachment._id.toString() !== attachmentId
    );

    if (updatedAttachments.length === task.attachments.length) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    task.attachments = updatedAttachments;
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error("Remove Attachment Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
