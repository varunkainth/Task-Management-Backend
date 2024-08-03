import Invitation from "../models/Invitation.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import { sendEmail } from "../utils/SendEmail.js";
import { getInvitationEmailHtml } from "../utils/Emails.js";

// Get invitations for a specific user
export const getUserInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const invitations = await Invitation.find({ email: req.user.email })
      .populate("sender", "name email")
      .populate("projectId", "name");

    if (!invitations) {
      return res.status(404).json({ message: "No invitations found for user" });
    }

    return res.status(200).json(invitations);
  } catch (error) {
    console.error("Get User Invitations Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch user invitations" });
  }
};

// Update invitation status
export const updateInvitationStatus = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Find and update the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    invitation.status = status;
    if (status === "Accepted") {
      invitation.acceptedAt = new Date();
    }
    await invitation.save();

    // Optionally, send an email notification
    await sendEmail({
      to: invitation.email,
      subject: `Invitation ${status}`,
      text: `Your invitation to the project has been ${status.toLowerCase()}.`,
    });

    return res
      .status(200)
      .json({ message: "Invitation status updated", invitation });
  } catch (error) {
    console.error("Update Invitation Status Error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update invitation status" });
  }
};

// Delete an invitation
export const deleteInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Find and delete the invitation
    const invitation = await Invitation.findByIdAndDelete(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    return res.status(200).json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Delete Invitation Error:", error);
    return res.status(500).json({ message: "Failed to delete invitation" });
  }
};

// Function to create an invitation
export const createInvitation = async (req, res) => {
  try {
    const { email, projectId } = req.body;
    const sender = req.user._id;

    if (!email || !projectId) {
      return res
        .status(400)
        .json({ message: "Email and project ID are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const invitation = new Invitation({ sender, projectId, email });
    await invitation.save();

    // Send email notification
    await sendInvitationEmail(email, project.name, req.user.name);

    res
      .status(201)
      .json({ message: "Invitation created successfully", invitation });
  } catch (error) {
    console.error("Create Invitation Error:", error);
    res.status(500).json({ message: "Failed to create invitation" });
  }
};

// Function to accept an invitation
export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const userId = req.user._id;

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if user is registered
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ message: "User is not registered. Please register first." });
    }

    if (invitation.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Invitation has already been responded to" });
    }

    // Update the invitation status to 'Accepted'
    invitation.status = "Accepted";
    invitation.acceptedAt = Date.now();
    await invitation.save();

    // Add the user to the project
    const project = await Project.findById(invitation.projectId);
    if (project) {
      project.members.push(userId);
      await project.save();
    }

    res
      .status(200)
      .json({ message: "Invitation accepted successfully", invitation });
  } catch (error) {
    console.error("Accept Invitation Error:", error);
    res.status(500).json({ message: "Failed to accept invitation" });
  }
};

// Function to reject an invitation
export const rejectInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const userId = req.user._id;

    // Find the invitation
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    // Check if user is registered
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ message: "User is not registered. Please register first." });
    }

    if (invitation.status !== "Pending") {
      return res
        .status(400)
        .json({ message: "Invitation has already been responded to" });
    }

    // Update the invitation status to 'Rejected'
    invitation.status = "Rejected";
    invitation.acceptedAt = Date.now(); // or set to null if you prefer
    await invitation.save();

    res
      .status(200)
      .json({ message: "Invitation rejected successfully", invitation });
  } catch (error) {
    console.error("Reject Invitation Error:", error);
    res.status(500).json({ message: "Failed to reject invitation" });
  }
};

// Function to get all invitations for the authenticated user
export const getAllInvitations = async (req, res) => {
  try {
    const userId = req.user._id;
    const invitations = await Invitation.find({ email: userId }).populate(
      "projectId",
      "name"
    );
    if (!invitations.length) {
      return res.status(404).json({ message: "No invitations found" });
    }
    res.status(200).json(invitations);
  } catch (error) {
    console.error("Get All Invitations Error:", error);
    res.status(500).json({ message: "Failed to retrieve invitations" });
  }
};

// Function to get a specific invitation by ID
export const getInvitationById = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const invitation = await Invitation.findById(invitationId).populate(
      "projectId",
      "name"
    );
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }
    res.status(200).json(invitation);
  } catch (error) {
    console.error("Get Invitation By ID Error:", error);
    res.status(500).json({ message: "Failed to retrieve invitation" });
  }
};
