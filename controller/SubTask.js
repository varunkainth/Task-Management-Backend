import SubTask from "../models/SubTask";
import Task from "../models/Task.js";

export const createSubTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, status, dueDate, priority } = req.body;

    // Validate required fields
    if (!title || !taskId) {
      return res.status(400).json({ message: "Title and taskId are required" });
    }

    // Check if the related task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Ensure dueDate is a valid date or null
    const dueDateParsed = dueDate ? new Date(dueDate) : null;

    // Create new sub-task
    const newSubTask = await SubTask.create({
      title,
      description: description || "",
      status: status || "Not Started",
      dueDate: dueDateParsed,
      priority: priority || "Low",
      taskId,
    });

    task.subTask = newSubTask._id;
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

export const 
