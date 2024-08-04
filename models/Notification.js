import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups by userId
    },
    type: {
      type: String,
      enum: ["Task Assignment", "Project Update", "Invitation"],
      required: true,
      index: true, // Index for faster filtering by type
    },
    message: { 
      type: String, 
      required: true 
    },
    read: {
      type: Boolean,
      default: false,
      index: true, // Index for faster filtering by read status
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true, // Index for faster lookups by timestamp
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true, // Index for faster lookups by projectId
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      index: true, // Index for faster lookups by taskId
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invitation",
      index: true, // Index for faster lookups by invitationId
    }
  },
  {
    versionKey: false,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
