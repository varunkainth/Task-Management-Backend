import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { uploadImage } from "../utils/UploadToCloudinary.js";

export const updateDetails = async (req, res) => {
  try {
    const { name, email, phoneNumber, dateOfBirth, gender,social } = req.body;
    const updates = {};

    // Validate input
    if (!name && !email && !phoneNumber && !dob && !gender) {
      return res.status(400).json({ message: "Please provide at least one field to update" });
    }

    // Create an object with the fields to update
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (dateOfBirth) updates.dateOfBirth = dateOfBirth;
    if (gender) updates.gender = gender;
    if (social) updates.social = social;

    // Update the user details
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User details updated successfully", user });
  } catch (err) {
    console.error("User Update Error:", err);
    res.status(500).json({ message: "Failed to update user details" });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide both old and new passwords" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({ message: "New password must be different from the old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Update Password Error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
};

export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a profile picture" });
    }

    const profilePicPath = req.file.path;
    const result = await uploadImage(profilePicPath);
    if (!result) {
      return res.status(400).json({ message: "Failed to upload image" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePic = result.url;
    await user.save();

    res.status(200).json({ message: "Profile picture updated successfully", profilePic: result.url });
  } catch (err) {
    console.error("Update Profile Pic Error:", err);
    res.status(500).json({ message: "Failed to update profile picture" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Failed to retrieve users" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get User Details Error:", err);
    res.status(500).json({ message: "Failed to retrieve user details" });
  }
};
