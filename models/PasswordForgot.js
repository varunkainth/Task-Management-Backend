import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

passwordResetTokenSchema.pre('save', async function(next) {
    if (this.isModified('token')) {
      try {
        const salt = await bcrypt.genSalt(11);
        this.token = await bcrypt.hash(this.token, salt);
      } catch (err) {
        return next(err);
      }
    }
    next();
  });

const PasswordResetToken = mongoose.model(
  "PasswordResetToken",
  passwordResetTokenSchema
);

export default PasswordResetToken