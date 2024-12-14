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
      },
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
      },
    ],
    subTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubTask",
      },
    ],
    users: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          index: true, // Index for faster lookups by users
        },
        role: {
          type: String,
          enum: ["Assignee", "Reviewer", "Observer"],
          default: "Assignee",
        },
        status: {
          type: String,
          enum: ["Active", "Completed", "Pending"],
          default: "Active",
        },
      },
    ],
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sprint",
      index: true, // Index for faster lookups by sprint
    },
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
        size: {
          type: Number, // File size in bytes
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["Pending", "Approved", "Rejected"],
          default: "Pending",
        },
      },
    ],
    dependencies: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Task",
          index: true, // Index for faster lookups by dependencies
        },
        relationship: {
          type: String,
          enum: ["Predecessor", "Successor"],
          default: "Predecessor",
        },
      },
    ],
    activityLog: [
      {
        type: {
          type: String, // "Status Changed", "Comment Added", etc.
          required: true,
        },
        description: {
          type: String, // A description of the activity
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
