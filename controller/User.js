import RefreshTokenModel from "../models/RefreshToken.js";
import User from "../models/User.js";
import JWTGen from "../utils/AuthToken.js";
import generateNumericId from "../utils/IdentityGen.js";
import bcrypt from "bcryptjs";
import { uploadImage } from "../utils/UploadToCloudinary.js";

export const UserRegister = async (req, res) => {
  try {
    const { name, password, email, phoneNumber, gender, dob } = req.body;

    if (
      [name, password, email, phoneNumber, gender, dob].some((field) => !field)
    ) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const existUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const label = gender === "male" ? "boy" : "girl";
    const profilePic = `https://avatar.iran.liara.run/public/${label}?username=${name.replace(
      /\s+/g,
      ""
    )}`;

    const Gender =
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
    console.log(Gender);

    const id = generateNumericId(dob, phoneNumber, Date.now());
    console.log(id);

    // Store User into Database
    const user = new User({
      name,
      password,
      email,
      phoneNumber,
      gender: Gender,
      dateOfBirth: dob,
      profilePic,
      id,
    });
    await user.save();

    const CreatedUser = await User.findById(user._id).select("-password");
    if (!CreatedUser) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    const AccessToken = JWTGen({ Id: user._id, Role: "Member", Time: "1h" });
    const RefreshToken = JWTGen({ Id: user._id, Role: "Member", Time: "30d" });

    // Convert RefreshToken to string
    const refreshTokenString = String(RefreshToken);

    // Hash Refresh Token
    const HashRefreshToken = await bcrypt.hash(refreshTokenString, 11);

    await RefreshTokenModel.create({
      userId: user._id,
      token: HashRefreshToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Save Token into cookies
    res.cookie("refreshToken", RefreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: true,
    });

    // Save AccessToken into Header
    res.header("Authorization", `Bearer ${AccessToken}`);

    return res.status(201).json({
      message: "User created successfully",
      user: CreatedUser,
      token: AccessToken,
    });
  } catch (err) {
    console.log("User Register Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const UserLogin = async (req, res) => {
  try {
    const { id, password } = req.body;
    if ([id, password].some((field) => !field)) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }
    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const AccessToken = JWTGen({ Time: "1h", Role: user.role, Id: user._id });
    const RefreshToken = JWTGen({ Time: "30d", Role: user.role, Id: user._id });
    const refreshTokenString = String(RefreshToken);
    const HashRefreshToken = await bcrypt.hash(refreshTokenString, 11);
    await RefreshTokenModel.findByIdAndUpdate(
      user._id,
      {
        token: HashRefreshToken,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      {
        new: true,
      }
    );

    const LoginUser = await User.findById(user._id).select("-password");
    res.cookie("refreshToken", RefreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: true,
    });
    res.header("Authorization", `Bearer ${AccessToken}`);
    return res.status(200).json({
      message: "User logged in successfully",
      user: LoginUser,
      token: AccessToken,
    });
  } catch (err) {
    console.log("User Login Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const UserLogout = async (req, res) => {
  try {
    // Clear Cookies
    res.clearCookie("refreshToken");
    res.clearCookie("Authorization");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    console.log("User Logout Error : ", err);
    res.status(500).json({ message: err.message });
  }
};

export const UpdateDeatils = async (req, res) => {
  try {
    const { name, email, phoneNumber, dob, gender } = req.body;

    if (!name && !email && !phoneNumber && !dob && !gender) {
      return res.status(400).json({ message: "Please fill the field" });
    }
    const user = await User.findById(req.user.Id);
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
    const user = await User.findById(req.user.Id);
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
    const user = await User.findById(req.user.Id);
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

