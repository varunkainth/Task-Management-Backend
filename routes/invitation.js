import { Router } from "express";
import {
  createInvitation,
  deleteInvitationById,
  getAllInvitationsByProjectId,
  getInvitationById,
  updateInvitation
} from "../controller/Invitation.js";
import TokenVerify from "../middleware/TokenVerification.js";
import AdminCheck from "../middleware/CheckAdmin.js";
import { cacheValue, getCachedValue, deleteCachedValue } from "../config/redis.js";

const router = Router();

// Create an invitation
router.post("/projects/:projectId/invitations", TokenVerify, async (req, res) => {
  try {
    await createInvitation(req, res);

    // Invalidate the cache for the specific project invitations
    const { projectId } = req.params;
    await deleteCachedValue(`project:${projectId}:invitations`);

    res.status(201).json({ message: "Invitation created successfully" });
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all invitations for a specific project
router.get("/projects/:projectId/invitations", async (req, res) => {
  try {
    const { projectId } = req.params;
    const cacheKey = `project:${projectId}:invitations`;
    const cachedInvitations = await getCachedValue(cacheKey);

    if (cachedInvitations) {
      return res.status(200).json(JSON.parse(cachedInvitations));
    }

    const invitations = await getAllInvitationsByProjectId(req, res);

    await cacheValue(cacheKey, JSON.stringify(invitations), 3600); // Cache for 1 hour
    res.status(200).json(invitations);
  } catch (error) {
    console.error("Error fetching all invitations for project:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get an invitation by ID
router.get("/invitations/:invitationId", async (req, res) => {
  try {
    const { invitationId } = req.params;
    const cacheKey = `invitation:${invitationId}`;
    const cachedInvitation = await getCachedValue(cacheKey);

    if (cachedInvitation) {
      return res.status(200).json(JSON.parse(cachedInvitation));
    }

    const invitation = await getInvitationById(req, res);

    await cacheValue(cacheKey, JSON.stringify(invitation), 3600); // Cache for 1 hour
    res.status(200).json(invitation);
  } catch (error) {
    console.error("Error fetching invitation by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update an invitation's status
router.put("/invitations/:invitationId", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { invitationId } = req.params;
    await updateInvitation(req, res);

    // Invalidate cache after update
    await deleteCachedValue(`invitation:${invitationId}`);

    // Also, invalidate the cache for the project's invitations list if needed
    const invitation = await getInvitationById(req, res);
    const { projectId } = invitation; // Ensure invitation contains the projectId
    await deleteCachedValue(`project:${projectId}:invitations`);

    res.status(200).json({ message: "Invitation updated successfully" });
  } catch (error) {
    console.error("Error updating invitation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete an invitation by ID
router.delete("/invitations/:invitationId", TokenVerify, AdminCheck, async (req, res) => {
  try {
    const { invitationId } = req.params;
    const invitation = await deleteInvitationById(req, res);

    // Invalidate cache after deletion
    await deleteCachedValue(`invitation:${invitationId}`);

    // Also, invalidate the cache for the project's invitations list if needed
    const { projectId } = invitation; // Ensure invitation contains the projectId
    await deleteCachedValue(`project:${projectId}:invitations`);

    res.status(200).json({ message: "Invitation deleted successfully" });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
