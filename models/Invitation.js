import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true, // Index for faster lookups by project
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups by sender
    },
    email: {
      type: String,
      required: true,
      index: true, // Index for faster lookups by email
      match: [/.+@.+\..+/, 'Please enter a valid email address'], // Email format validation
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true, // Index for faster filtering by status
    },
  },
  { 
    timestamps: true,
    versionKey: false, // Disable version key for better performance and reduced document size
  }
);

// Compound index to ensure a unique invitation per project and email
invitationSchema.index({ projectId: 1, email: 1 }, { unique: true });

const Invitation = mongoose.model("Invitation", invitationSchema);
export default Invitation;
