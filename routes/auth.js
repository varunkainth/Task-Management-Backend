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

// Wrapper function to handle async errors
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// User registration route
router.post("/register", asyncHandler(userRegister));

// User login route
router.post("/login", asyncHandler(userLogin));

// User logout route
router.post(
  "/logout",
  TokenVerify,
  asyncHandler(async (req, res) => {
    await userLogout(req, res);
    const userId = req.user._id;
    await deleteCachedValue(`user:${userId}:session`);
    res.status(200).json({ message: "Logged out successfully" });
  })
);

// Create a password reset token
router.post(
  "/password-reset-token",
  asyncHandler(async (req, res) => {
    const response = await createPasswordResetToken(req.body);
    res.status(200).json(response);
  })
);

// Verify a password reset token
router.post(
  "/verify-password-reset-token",
  asyncHandler(async (req, res) => {
    // console.log('Request body:', req.body); 
    const { token } = req.body;
    const response = await verifyPasswordResetToken(token);
   return res.status(200).json(response);
  })
);

// Use a password reset token to set a new password
router.post(
  "/use-password-reset-token",
  asyncHandler(async (req, res) => {
    
    const response = await usePasswordResetToken(req.body);
    res.status(200).json(response);
  })
);

// Refresh an access token using a refresh token
router.post(
  "/refresh-token",
  asyncHandler(async (req, res) => {
    const response = await refreshToken(req.body);
    const { userId, accessToken } = response;
    await cacheValue(`user:${userId}:accessToken`, accessToken, 3600);
    res.status(200).json(response);
  })
);

// Revoke a refresh token
router.post(
  "/revoke-refresh-token",
  TokenVerify,
  asyncHandler(async (req, res) => {
    const response = await revokeRefreshToken(
      req.user._id,
      req.body.refreshToken
    );
    await deleteCachedValue(`user:${req.user._id}:refreshToken`);
    res.status(200).json(response);
  })
);

router.post("/google", asyncHandler(GoogleSignup));
router.post("/github", asyncHandler(GithubSignUp));
router.post("/verify/email", asyncHandler(VerifyEmail));
router.post("/verify/totp", TokenVerify, asyncHandler(verifyTOTP));

export default router;
