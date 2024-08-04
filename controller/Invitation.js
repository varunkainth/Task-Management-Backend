import Invitation from "../models/Invitation.js";
import Notification from "../models/Notification.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { getInvitationEmailHtml } from "../utils/Emails.js";
import { sendEmail } from "../utils/SendEmail.js";

// Create an invitation
export const createInvitation = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    // Check if the project exists
    const project = await Project.findById(projectId).populate("createdBy");
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check for an existing invitation
    const existingInvitation = await Invitation.findOne({ projectId, email });
    if (existingInvitation) {
      return res.status(400).json({ message: "Invitation already exists" });
    }

    // Create the invitation
    const invitation = new Invitation({
      projectId,
      sender: req.user._id,
      email,
    });

    // Add the invite to the project's invites list
    project.invites.push({
      email,
      status: "Pending",
      sentAt: Date.now(),
    });

    const notification = new Notification({
      type: "Invitation",
      message: `You have been invited to join the project: ${project.name}`,
      invitationId: invitation._id,
      projectId: project._id,
    });

    // Get user and add notification
    const user = await User.findOne({ email }).lean();
    if (user) {
      notification.userId = user._id;
    }

    // Execute all database operations concurrently
    await Promise.all([
      invitation.save(),
      project.save(),
      notification.save(),
      sendEmail({
        to: email,
        subject: "Invitation to Join Project",
        html: getInvitationEmailHtml(project.name, project.createdBy.name),
      }),
    ]);

    res
      .status(201)
      .json({ message: "Invitation created successfully", invitation });
  } catch (err) {
    console.error("Invitation Create Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all invitations by project ID
export const getAllInvitationsByProjectId = async (req, res) => {
  try {
    const { projectId } = req.params;

    const invitations = await Invitation.find({ projectId })
      .populate("sender", "name email")
      .populate("projectId", "name")
      .lean(); // Returns plain JavaScript objects

    if (!invitations.length) {
      return res.status(404).json({ message: "No invitations found" });
    }

    res.status(200).json(invitations);
  } catch (err) {
    console.error("Get All Invitations By ProjectId Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get an invitation by ID
export const getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await Invitation.findById(invitationId)
      .populate("projectId", "name")
      .populate("sender", "name email")
      .lean(); // Returns plain JavaScript objects

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    res.status(200).json(invitation);
  } catch (err) {
    console.error("Get Invitation By Id Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update an invitation's status
export const updateInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find the invitation
    const invitation = await Invitation.findById(invitationId).lean();
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if the user is registered
    const user = await User.findOne({ email: invitation.email }).lean();
    if (!user && status === "Accepted") {
      return res
        .status(404)
        .json({ message: "User not found, please register first." });
    }

    // Update the invitation status in the project
    const project = await Project.findOneAndUpdate(
      { _id: invitation.projectId, "invites.email": invitation.email },
      { $set: { "invites.$.status": status } },
      { new: true }
    ).lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Add the user to the project's members array if the invitation is accepted
    if (status === "Accepted" && !project.members.includes(user._id)) {
      project.members.push(user._id);
      await project.save();
    }

    // Create and save notification for the project creator
    const notification = new Notification({
      userId: project.createdBy,
      type: "Invitation",
      message: `User with email ${
        invitation.email
      } has ${status.toLowerCase()} the invitation.`,
      projectId: project._id,
      invitationId: invitation._id,
    });

    await notification.save();

    res.status(200).json({
      message: `Invitation status updated to ${status} and notification sent to the project creator.`,
      project,
    });
  } catch (err) {
    console.error("Update Invitation Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete an invitation by ID
export const deleteInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find the invitation and populate sender and project
    const invitation = await Invitation.findById(invitationId)
      .populate("sender", "role")
      .populate("projectId", "createdBy")
      .lean();

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if the user is authorized to delete the invitation
    const isAuthorized =
      invitation.sender._id.equals(req.user._id) || req.user.role === "Admin";

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this invitation" });
    }

    await Invitation.findByIdAndDelete(invitationId);

    res.status(200).json({ message: "Invitation deleted successfully" });
  } catch (err) {
    console.error("Delete Invitation By Id Error", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
