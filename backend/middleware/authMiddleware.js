const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

/**
 * requireAuth middleware
 * Checks for:
 *  1. Passport session (req.isAuthenticated())
 *  2. JWT token in Authorization: Bearer <token> header
 */
module.exports.requireAuth = async (req, res, next) => {
  // 1. Check if Passport session is active
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // 2. Check Authorization header for JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "doodle-jwt-secret"
      );
      const user = await User.findById(decoded.id).select("-passwordHash");
      if (!user) {
        return res.status(401).json({ message: "Token valid but user not found." });
      }
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Token expired or invalid. Please log in again." });
    }
  }

  return res.status(401).json({ message: "Authentication required. Please log in." });
};
