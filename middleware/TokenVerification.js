import jwt from "jsonwebtoken";
import User from "../models/User.js";

const TokenVerify = async (req, res, next) => {
  try {
    // Extract token from headers, cookies, or body
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token || req.body.token;

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    let decoded;
    try {
      // Verify token
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      const errorMessages = {
        TokenExpiredError: "Token has expired",
        JsonWebTokenError: "Invalid token",
        NotBeforeError: "Token not active",
      };
      
      const message = errorMessages[err.name] || "Failed to authenticate token";
      console.error("Token verification error: ", err);
      return res.status(401).json({ message });
    }

    // Attach user to the request object
    const user = await User.findById(decoded.Id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error in Token Verification: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default TokenVerify;
