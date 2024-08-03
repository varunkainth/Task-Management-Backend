import express from "express";
import {
  createInvitation,
  acceptInvitation,
  rejectInvitation,
  getAllInvitations,
  getInvitationById,
} from "../controller/Invitation.js";
import TokenVerify from "../middleware/TokenVerification.js";

const router = express.Router();

// Route to create a new invitation
router.post("/invitations", TokenVerify, createInvitation);

// Route to accept an invitation
router.patch(
  "/invitations/:invitationId/accept",
  TokenVerify,
  acceptInvitation
);

// Route to reject an invitation
router.patch(
  "/invitations/:invitationId/reject",
  TokenVerify,
  rejectInvitation
);

// Route to get all invitations for the authenticated user
router.get("/invitations", TokenVerify, getAllInvitations);

// Route to get a specific invitation by ID
router.get("/invitations/:invitationId", TokenVerify, getInvitationById);

export default router;
