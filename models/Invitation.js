import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
    sentAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Invitation = mongoose.model("Invitation", invitationSchema);
export default Invitation;
