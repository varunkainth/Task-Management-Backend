import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import CryptoService from "../utils/Encryption.js";
import dotenv from "dotenv"
dotenv.config()
const crypto = new CryptoService(process.env.CRYPTO_ENCRYPTION_KEY);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["Admin", "Member"],
      default: "Member",
      index: true,
    },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dateOfBirth: {
      type: Date,
    },
    phoneNumber: {
      type: String,
      // match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"], // Phone number format validation
    },
    profilePic: {
      type: String,
      required: true,
    },
    uid: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ["github", "google", "local"],
    },
    totp_secret: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    try {
      user.password = await bcrypt.hash(user.password, 11);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("totp_secret")) {
    try {
      user.totp_secret = crypto.encrypt(user.totp_secret);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
