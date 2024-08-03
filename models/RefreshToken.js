import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    revoked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);



const RefreshTokenModel = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshTokenModel;
