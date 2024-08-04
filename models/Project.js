import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true, // Index for faster searches by name
    },
    description: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups by creator
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true, // Index for faster lookups by members
      },
    ],
    invites: [
      {
        email: {
          type: String,
          required: true,
          index: true, // Index for faster lookups by email
        },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
          index: true, // Index for faster filtering by status
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

projectSchema.index({ name: 1, createdBy: 1 }, { unique: true }); // Compound index if needed

const Project = mongoose.model("Project", projectSchema);
export default Project;
