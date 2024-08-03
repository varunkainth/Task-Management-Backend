import RefreshTokenModel from "../models/RefreshToken.js";
import User from "../models/User.js";
import JWTGen from "../utils/AuthToken.js";
import generateNumericId from "../utils/IdentityGen.js";
import bcrypt from "bcryptjs";



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