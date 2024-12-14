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
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization", // Link to Organization
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups by creator
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["Admin", "Manager", "Member", "Viewer"],
          default: "Member",
        },
      },
    ],
    invites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invitation",
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    isArchived: {
      type: Boolean,
      default: false,
    },
    deadline: {
      type: Date,
    },
    milestones: [
      {
        title: { type: String },
        dueDate: { type: Date },
        status: {
          type: String,
          enum: ["Not Started", "In Progress", "Completed"],
        },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Completed", "Archived"],
      default: "Active",
    },
    activityLog: [
      {
        type: String,
      },
    ],
    completionDate: {
      type: Date,
    },
    sprints: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sprint",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: true,
  }
);

projectSchema.index({ name: 1, createdBy: 1 }, { unique: true });

const Project = mongoose.model("Project", projectSchema);
export default Project;
