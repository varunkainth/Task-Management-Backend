import jwt from "jsonwebtoken";
import User from "../models/User.js";

const TokenVerify = async (req, res, next) => {
  try {
    // Extract token from headers, cookies, or body
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies.token ||
      req.body.token;

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    let decoded;
    try {
      // Verify token
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token has expired" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      } else if (err.name === "NotBeforeError") {
        return res.status(401).json({ message: "Token not active" });
      } else {
        console.error("Token verification error: ", err);
        return res
          .status(500)
          .json({ message: "Failed to authenticate token" });
      }
    }

    // Attach user to the request object
    const user = await User.findById(decoded.Id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    console.error("Error in Token Verification: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default TokenVerify;
