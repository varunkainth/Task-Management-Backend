import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Who the notification is for
      required: true,
    },
    message: {
      type: String,
      required: true, // Notification message (can be dynamic based on event)
    },
    type: {
      type: String,
      enum: [
        "Task Assigned",
        "Task Updated",
        "Project Created",
        "Project Archived",
        "Invite Received",
        "Invite Accepted",
        "Mentioned",
        "Reminder",
        "System Update",
      ], // Type of notification
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel", // Reference to the object related to this notification
      required: true,
    },
    referenceModel: {
      type: String,
      enum: ["Task", "Project", "Invite", "User"], // Model this notification relates to (task, project, etc.)
      required: true,
    },
    read: {
      type: Boolean,
      default: false, // Whether the notification has been read or not
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
