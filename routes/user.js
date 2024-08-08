import { Router } from "express";
import {
  deleteUser,
  getAllUsers,
  getUserDetails,
  updateDetails,
  updatePassword,
  updateProfilePic,
} from "../controller/User.js";
import TokenVerify from "../middleware/TokenVerification.js";
import upload from "../middleware/multer.js";
import { cacheValue, getCachedValue, deleteCachedValue } from '../config/redis.js';

const router = Router();

// Update user details (Requires authentication)
router.put("/users/update", TokenVerify, async (req, res) => {
  try {
    const response = await updateDetails(req, res);
    const userId = req.user._id;
    await deleteCachedValue(`user:${userId}:details`); // Invalidate user details cache
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ message: 'An error occurred while updating user details.' });
  }
});

// Update user password (Requires authentication)
router.put("/users/update-password", TokenVerify, async (req, res) => {
  try {
    const response = await updatePassword(req, res);
    const userId = req.user._id;
    await deleteCachedValue(`user:${userId}:details`); // Invalidate user details cache
    res.status(200).json(response);
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ message: 'An error occurred while updating user password.' });
  }
});

// Update user profile picture (Requires authentication)
router.post(
  "/users/update-profile-pic",
  TokenVerify,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const response = await updateProfilePic(req, res);
      const userId = req.user._id;
      await deleteCachedValue(`user:${userId}:details`); // Invalidate user details cache
      res.status(200).json(response);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      res.status(500).json({ message: 'An error occurred while updating profile picture.' });
    }
  }
);

// Delete a user (Requires authentication)
router.delete("/users/delete", TokenVerify, async (req, res) => {
  try {
    const response = await deleteUser(req, res);
    const userId = req.user._id;
    await deleteCachedValue(`user:${userId}:details`); // Invalidate user details cache
    res.status(200).json(response);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'An error occurred while deleting the user.' });
  }
});

// Get all users (Requires authentication, optionally restricted to admin role)
router.get("/users", TokenVerify, async (req, res) => {
  try {
    const cacheKey = 'allUsers';
    const cachedUsers = await getCachedValue(cacheKey);

    if (cachedUsers) {
      return res.status(200).json(JSON.parse(cachedUsers));
    }

    const response = await getAllUsers(req, res);
    await cacheValue(cacheKey, JSON.stringify(response), 600); // Cache for 10 minutes
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'An error occurred while fetching all users.' });
  }
});

// Get details of a specific user (Requires authentication)
router.get("/users/:id", TokenVerify, async (req, res) => {
  try {
    const userId = req.params.id;
    const cacheKey = `user:${userId}:details`;
    const cachedUser = await getCachedValue(cacheKey);

    if (cachedUser) {
      return res.status(200).json(JSON.parse(cachedUser));
    }

    const response = await getUserDetails(req, res);
    await cacheValue(cacheKey, JSON.stringify(response), 300); // Cache for 5 minutes
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'An error occurred while fetching user details.' });
  }
});

export default router;
