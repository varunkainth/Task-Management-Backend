import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { uploadImage } from "../utils/UploadToCloudinary.js";

export const updateDetails = async (req, res) => {
  try {
    const { name, email, phoneNumber, dob, gender, socialMediaLinks, about } =
      req.body;
    const updates = {};

    // Validate input
    if (
      !name &&
      !email &&
      !phoneNumber &&
      !dob &&
      !gender &&
      !socialMediaLinks &&
      !about
    ) {
      return res
        .status(400)
        .json({ message: "Please provide at least one field to update" });
    }

    // Create an object with the fields to update
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (dob) updates.dateOfBirth = dob;
    if (gender) updates.gender = gender;
    if (about) update.about = about;

    // Validate social media links
    if (socialMediaLinks) {
      if (!Array.isArray(socialMediaLinks)) {
        return res
          .status(400)
          .json({ message: "Social media links must be an array" });
      }
      for (const link of socialMediaLinks) {
        if (!link.platform || !link.link) {
          return res
            .status(400)
            .json({ message: "Invalid social media link format" });
        }
      }
      updates.socialMediaLinks = socialMediaLinks;
    }

    // Update the user details
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
    })
      .select("-password")
      .select("totp");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User details updated successfully",
      user: user,
    });
  } catch (err) {
    console.error("User Update Error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update user details", error: err.message });
  }
};

export const updateProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return { message: "Please upload a profile picture" };
    }

    const profilePicPath = req.file.path;
    const result = await uploadImage(profilePicPath);
    if (!result) {
      return res.status(400).json({ message: "Failed to upload image" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return { message: "User not found" };
    }

    user.profilePic = result.url;
    await user.save();

    return {
      message: "Profile picture updated successfully",
      profilePic: result.url,
    };
  } catch (err) {
    console.error("Update Profile Pic Error:", err);
    return { message: "Failed to update profile picture" };
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
    const users = await User.find().select("-password").select("totp");
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    return res.status(200).json({ user: users });
  } catch (err) {
    console.error("Get All Users Error:", err);
    return { message: "Failed to retrieve users" };
  }
};

export const getUserDetailsById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return user;
  } catch (err) {
    console.error("Get User Details Error:", err);
    return { message: "Failed to retrieve user details" };
  }
};

export const getUserDetail = async (req) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");
    console.log(user);
    if (!user) {
      return { message: "User not found" };
    }
    return user;
  } catch (err) {
    console.error("Get User Details Error:", err);
    return { message: "Failed to retrieve user details" };
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const { notifications, theme, language } = req.body;
    const userId = req.user._id;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        preferences: {
          notifications: notifications,
          theme: theme,
          language: language,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Preferences updated",
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res
      .status(500)
      .json({ message: "Failed to update preferences", error: error.message });
  }
};
