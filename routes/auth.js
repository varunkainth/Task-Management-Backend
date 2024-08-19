import { Router } from "express";
import TokenVerify from "../middleware/TokenVerification.js";
import {
  createPasswordResetToken,
  GithubSignUp,
  GoogleSignup,
  refreshToken,
  revokeRefreshToken,
  usePasswordResetToken,
  userLogin,
  userLogout,
  userRegister,
  VerifyEmail,
  verifyPasswordResetToken,
  verifyTOTP,
} from "../controller/Auth.js";
import {
  cacheValue,
  getCachedValue,
  deleteCachedValue,
} from "../config/redis.js";

const router = Router();

// User registration route
router.post("/register", userRegister);

// User login route
router.post("/login", userLogin);

// User logout route
router.post("/logout", TokenVerify, async (req, res) => {
  try {
    // Perform logout operation
    await userLogout(req, res);
    if (res.headersSent) {
      return;
    }

    // Invalidate user session cache if needed
    const userId = req.user._id; // Ensure userId is available in the request
    await deleteCachedValue(`user:${userId}:session`);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create a password reset token
router.post("/password-reset-token", async (req, res) => {
  try {
    const response = await createPasswordResetToken(req, res);
    // Cache or store the response as needed
    res.status(200).json(response);
  } catch (error) {
    console.error("Error creating password reset token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Verify a password reset token
router.post("/verify-password-reset-token", async (req, res) => {
  try {
    const response = await verifyPasswordResetToken(req, res);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error verifying password reset token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Use a password reset token to set a new password
router.post("/use-password-reset-token", async (req, res) => {
  try {
    const response = await usePasswordResetToken(req, res);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error using password reset token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Refresh an access token using a refresh token
router.post("/refresh-token", async (req, res) => {
  try {
    const response = await refreshToken(req, res);

    // Cache the new access token
    const { userId, accessToken } = response;
    await cacheValue(`user:${userId}:accessToken`, accessToken, 3600); // Cache for 1 hour

    res.status(200).json(response);
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Revoke a refresh token
router.post("/revoke-refresh-token", TokenVerify, async (req, res) => {
  try {
    const response = await revokeRefreshToken(req, res);

    // Invalidate cache for the revoked refresh token
    const userId = req.user._id; // Ensure userId is available in the request
    await deleteCachedValue(`user:${userId}:refreshToken`);

    res.status(200).json(response);
  } catch (error) {
    console.error("Error revoking refresh token:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.route("/google").post(GoogleSignup);
router.route("/github").post(GithubSignUp);
router.route("/verify/email").post(VerifyEmail);
router.route("/verify/totp").post(TokenVerify, verifyTOTP);

export default router;
