import SubTask from "../models/SubTask";
import Task from "../models/Task.js";

export const createSubTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, dueDate, priority, attachments } = req.body;

    if (!title || !taskId) {
      return res.status(400).json({ message: "Title and taskId are required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const dueDateParsed = dueDate ? new Date(dueDate) : null;

    const newSubTaskData = {
      title,
      description: description || "",
      status: status || "Not Started",
      dueDate: dueDateParsed,
      priority: priority || "Low",
      taskId,
    };

    if (attachments && Array.isArray(attachments)) {
      newSubTaskData.attachments = attachments.map((attachment) => ({
        filename: attachment.filename,
        url: attachment.url,
        fileType: attachment.fileType,
      }));
    }

    const newSubTask = await SubTask.create(newSubTaskData);

    // Update the related task with the new sub-task ID (if necessary)
    task.subTasks.push(newSubTask._id);
    await task.save();

    // Return the created sub-task
    res.status(201).json({
      message: "Sub-task created successfully",
      newSubTask,
    });
  } catch (error) {
    console.error("Sub-task Create Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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

export const getAllSubTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const subTasks = await SubTask.find({ taskId }).populate("taskId");
    if (!subTasks) {
      return res.status(404).json({ message: "No sub-tasks found" });
    }
    res.status(200).json(subTasks);
  } catch (error) {
    console.error("Sub-task List Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const { title, description, priority, dueDate, status } = req.body;
    const updateSubTask = await SubTask.findById(subTaskId);
    if (!updateSubTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }
    if (title) updateSubTask.title = title;
    if (description) updateSubTask.description = description;
    if (priority) updateSubTask.priority = priority;
    if (dueDate) updateSubTask.dueDate = dueDate;
    if (status) updateSubTask.status = status;
    await updateSubTask.save();
    res.status(200).json(updateSubTask);
  } catch (error) {
    console.error("Sub-task Update Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const subTask = await SubTask.findById(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }
    await subTask.remove();
    res.status(200).json({ message: "Sub-task deleted successfully" });
  } catch (error) {
    console.error("Sub-task Delete Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addAttachmentsToSubTask = async (req, res) => {
  try {
    const subTaskId = req.params.id;
    const newAttachments = req.body.attachments;

    const subTask = await SubTask.findById(subTaskId);
    if (!subTask) {
      return res.status(404).json({ message: "Sub-task not found" });
    }

    subTask.attachments = subTask.attachments.concat(newAttachments);

    await subTask.save();
    
    res.status(200).json(subTask);
  } catch (error) {
    console.error("Sub-task Attachments Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
