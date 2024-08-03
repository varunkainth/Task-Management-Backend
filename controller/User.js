import RefreshTokenModel from "../models/RefreshToken.js";
import User from "../models/User.js";
import JWTGen from "../utils/AuthToken.js";
import generateNumericId from "../utils/IdentityGen.js";
import bcrypt from "bcryptjs";
import { uploadImage } from "../utils/UploadToCloudinary.js";

export const UpdateDeatils = async (req, res) => {
  try {
    const { name, email, phoneNumber, dob, gender } = req.body;

    if (!name && !email && !phoneNumber && !dob && !gender) {
      return res.status(400).json({ message: "Please fill the field" });
    }
    const user = await User.findById(req.user._id);
    if (name) {
      user.name = name;
    }
    if (email) {
      user.email = email;
    }
    if (phoneNumber) {
      user.phoneNumber = phoneNumber;
    }
    if (dob) {
      user.dateOfBirth = dob;
    }
    if (gender) {
      user.gender = gender;
    }
    await user.save();
    res.status(200).json({ message: "User details updated successfully" });
  } catch (err) {
    console.log("User Update Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const UpdatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if ([oldPassword, newPassword].some((field) => !field)) {
      return res.status(400).json({ message: "Please fill the field" });
    }
    const user = await User.findById(req.user._id);
    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }
    if (newPassword === oldPassword) {
      return res.status(400).json({
        message: "New password should be different from old password",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.log("Update Password Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console(req.file);
    const profilePicPath = req.file?.path;
    if (!profilePic) {
      return res
        .status(400)
        .json({ message: "Please upload a profile picture" });
    }

    const result = await uploadImage(profilePicPath);
    if (!result) {
      return res.status(400).json({ message: "Failed to upload image" });
    }
    console.log(result);
    user.profilePic = result.url;
  } catch (err) {
    console.log("Update Profile Pic Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const DeleteUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    console.error("Delete User Error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the user." });
  }
};

export const getAllUser = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (err) {
    console.log("Get All User Error : ", err);
    res.status(500).json({ message: err.message });
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
    console.log("Get User Details Error : ", err);
    res.status(500).json({ message: err.message });
  }
};
