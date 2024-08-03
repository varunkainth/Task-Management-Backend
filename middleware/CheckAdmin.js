import jwt from "jsonwebtoken";
import User from "../models/User.js";

const AdminCheck = async (req, res, next) => {
  try {
    // Extract token from headers, cookies, or body
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.cookies.token ||
      req.body.token;

    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // Check if the user's role is "admin"
    if (decoded.Role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    // Attach user to the request object
    const user = await User.findById(decoded.Id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Error in AdminCheck middleware: ", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default AdminCheck;
