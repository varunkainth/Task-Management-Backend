import RefreshTokenModel from "../models/RefreshToken.js";
import User from "../models/User.js";
import JWTGen from "../utils/AuthToken.js";
import generateNumericId from "../utils/IdentityGen.js";
import PasswordResetToken from "../models/PasswordForgot.js";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { HttpStatusCodes } from "../utils/response.js";

export const userRegister = async (req, res) => {
  try {
    const { name, password, email, phoneNumber, gender, dob } = req.body;
    // print all values
    console.log(name, password, email, phoneNumber, gender, dob);

    // Validate input
    if (
      [name, password, email, phoneNumber, gender, dob].some((field) => !field)
    ) {
      return res
        .status(HttpStatusCodes.BAD_REQUEST.code)
        .json({ message: "Please fill in all fields" });
    }

    // Check if user already exists
    const existUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existUser) {
      return res
        .status(HttpStatusCodes.CONFLICT.code)
        .json({ message: "User already exists" });
    }

    // Generate profile picture URL
    const label = gender === "male" ? "boy" : "girl";
    const profilePic = `https://avatar.iran.liara.run/public/${label}?username=${name.replace(
      /\s+/g,
      ""
    )}`;

    const formattedGender =
      gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

    // Generate user ID
    const id = generateNumericId(dob, phoneNumber, Date.now());

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = new User({
      name,
      password: hashedPassword,
      email,
      phoneNumber,
      gender: formattedGender,
      dateOfBirth: dob,
      profilePic,
      id,
      provider: "local",
    });
    await user.save();

    // Create tokens
    const accessToken = await JWTGen({
      Id: user._id,
      Role: "Member",
      Time: "1h",
    });
    const refreshToken = await JWTGen({
      Id: user._id,
      Role: "Member",
      Time: "30d",
    });

    // Hash refresh token
    const hashedRefreshToken = await bcrypt.hash(String(refreshToken), 11);
    console.log(hashedRefreshToken);
    // Save refresh token in the database
    await RefreshTokenModel.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    // Send response
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: true,
    });
    res.header("Authorization", `Bearer ${accessToken}`);
    res.status(HttpStatusCodes.OK.code).json({
      message: "User created successfully",
      user: { ...user._doc, password: undefined }, // Exclude password from response
      token: accessToken,
    });
  } catch (err) {
    console.error("User Register Error:", err.message);
    res
      .status(HttpStatusCodes.INTERNAL_SERVER_ERROR.code)
      .json({ message: "Failed to register user" });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
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

    // Create tokens
    const accessToken = JWTGen({ Time: "1h", Role: user.role, Id: user._id });
    const refreshToken = JWTGen({ Time: "30d", Role: user.role, Id: user._id });

    // Hash refresh token
    const hashedRefreshToken = await bcrypt.hash(String(refreshToken), 11);

    // Update or create refresh token in the database
    await RefreshTokenModel.findOneAndUpdate(
      { userId: user._id },
      {
        token: hashedRefreshToken,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      },
      { upsert: true }
    );

    // Send response
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: true,
    });
    res.header("Authorization", `Bearer ${accessToken}`);
    res.status(200).json({
      message: "User logged in successfully",
      user: { ...user._doc, password: undefined }, // Exclude password from response
      token: accessToken,
    });
  } catch (err) {
    console.error("User Login Error:", err.message);
    res.status(500).json({ message: "Failed to login user" });
  }
};

export const userLogout = async (req, res) => {
  try {
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "User logged out successfully" });
  } catch (err) {
    console.error("User Logout Error:", err.message);
    res.status(500).json({ message: "Failed to logout user" });
  }
};

export const createPasswordResetToken = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = Math.random().toString(36).substr(2); // Generate a random token

    const passwordResetToken = new PasswordResetToken({
      userId,
      token,
      expiresAt: new Date(Date.now() + 3600000), // Token valid for 1 hour
    });

    const savedToken = await passwordResetToken.save();

    res.status(201).json({
      message: "Password reset token created successfully",
      token: savedToken,
    });
  } catch (error) {
    console.error("Create Password Reset Token Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyPasswordResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    if (passwordResetToken.used) {
      return res.status(400).json({ message: "Token already used" });
    }

    if (new Date() > passwordResetToken.expiresAt) {
      return res.status(400).json({ message: "Token expired" });
    }

    // Token is valid, proceed with password reset logic
    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    console.error("Verify Password Reset Token Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const usePasswordResetToken = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    const passwordResetToken = await PasswordResetToken.findOne({ token });

    if (!passwordResetToken) {
      return res.status(404).json({ message: "Invalid or expired token" });
    }

    if (passwordResetToken.used) {
      return res.status(400).json({ message: "Token already used" });
    }

    if (new Date() > passwordResetToken.expiresAt) {
      return res.status(400).json({ message: "Token expired" });
    }

    const user = await User.findById(passwordResetToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password and update the user's password
    const salt = await bcrypt.genSalt(11);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Mark the token as used
    passwordResetToken.used = true;
    await passwordResetToken.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Use Password Reset Token Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const refreshToken = await RefreshTokenModel.findOne({ token });

    if (
      !refreshToken ||
      refreshToken.revoked ||
      new Date() > refreshToken.expiresAt
    ) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { userId: refreshToken.userId },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const revokeRefreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const refreshToken = await RefreshTokenModel.findOne({ token });

    if (!refreshToken) {
      return res.status(404).json({ message: "Token not found" });
    }

    refreshToken.revoked = true;
    await refreshToken.save();

    res.status(200).json({ message: "Token revoked successfully" });
  } catch (error) {
    console.error("Revoke Refresh Token Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const GoogleSignup = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(id);
    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists by UID
    let user = await User.findOne({ uid });

    if (user) {
      // User exists, generate tokens
      const accessToken = JWTGen({ Id: user._id, Role: "Member", Time: "1h" });
      const refreshToken = JWTGen({
        Id: user._id,
        Role: "Member",
        Time: "30d",
      });

      // Hash the refresh token
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 11);

      // Save the hashed refresh token in the database
      await RefreshTokenModel.create({
        userId: user._id,
        token: hashedRefreshToken,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      // Set cookies and headers
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production", // Use secure cookies only in production
      });

      res.header("Authorization", `Bearer ${accessToken}`);
      return res.status(200).json({
        message: "User already exists",
        user: { ...user._doc, password: undefined },
        token: accessToken,
      });
    }

    // Create a new user
    const newUser = new User({
      uid,
      email,
      name,
      profilePic: picture,
      provider: "google",
      isVerified: true,
    });

    await newUser.save();

    // Generate tokens
    const accessToken = JWTGen({ Id: newUser._id, Role: "Member", Time: "1h" });
    const refreshToken = JWTGen({
      Id: newUser._id,
      Role: "Member",
      Time: "30d",
    });

    // Hash the refresh token
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 11);

    // Save the hashed refresh token in the database
    await RefreshTokenModel.create({
      userId: newUser._id,
      token: hashedRefreshToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Set cookies and headers
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production
    });

    res.header("Authorization", `Bearer ${accessToken}`);
    return res.status(201).json({
      message: "User created successfully",
      user: { ...newUser._doc, password: undefined }, // Exclude password from response
      token: accessToken,
    });
  } catch (err) {
    console.error("Google Sign-Up Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const GithubSignUp = async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const accessToken = JWTGen({
        Id: existingUser._id,
        Role: "Member",
        Time: "1h",
      });
      const refreshToken = JWTGen({
        Id: existingUser._id,
        Role: "Member",
        Time: "30d",
      });

      const hashedRefreshToken = await bcrypt.hash(refreshToken, 11);

      await RefreshTokenModel.create({
        userId: existingUser._id,
        token: hashedRefreshToken,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
      });

      // secure: process.env.NODE_ENV === 'production', // Use secure cookies only in production

      res.header("Authorization", `Bearer ${accessToken}`);
      res.status(200).json({
        message: "User already exists",
        user: { ...existingUser._doc, password: undefined },
        token: accessToken,
      });
    } else {
      const newUser = new User({
        email,
        name,
        picture,
        password: undefined,
        provider: "github",
        uid,
        isVerified: true,
      });
      await newUser.save();
      const accessToken = JWTGen({
        Id: newUser._id,
        Role: "Member",
        Time: "1h",
      });
      const refreshToken = JWTGen({
        Id: newUser._id,
        Role: "Member",
        Time: "30d",
      });
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 11);
      await RefreshTokenModel.create({
        userId: newUser._id,
        token: hashedRefreshToken,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });
      res.header("Authorization", `Bearer ${accessToken}`);

      return res.status(201).json({
        message: "User Created Successfully",
        user: { ...newUser._doc, password: undefined },
        token: accessToken,
      });
    }
  } catch (err) {
    console.error("Github Sign-Up Error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
