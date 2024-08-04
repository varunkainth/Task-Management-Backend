import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true, // Index for faster searches
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
      index: true, // Index for faster filtering
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Low",
      index: true, // Index for sorting by priority
    },
    dueDate: {
      type: Date,
      index: true, // Index for querying by dueDate
    },
    dependencies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        index: true, // Index for faster lookups by dependencies
      }
    ],
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true, // Index for faster lookups by projectId
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      }
    ],
    subTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubTask",
      }
    ],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true, // Index for faster lookups by users
      }
    ],
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        fileType: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
