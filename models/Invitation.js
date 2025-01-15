import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      index: true, // Index for faster lookups by project
    },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      index: true, // Index for faster lookups by organisation
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
      match: [/.+@.+\..+/, "Please enter a valid email address"], // Email format validation
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true, // Index for faster filtering by status
    },
    role: {
      type: String,
      enum: ["Admin", "Member", "Viewer"],
      default: "Member", // Default role is "Member"
    },
    expirationDate: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default expiration time is 24 hours after the invitation is sent
    },
    inviteLink: {
      type: String, // Store a unique invite link if needed
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
