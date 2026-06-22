const express = require("express");
const passport = require("passport");
const {
  register,
  login,
  logout,
  me,
  googleCallback,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Local auth
router.post("/register", register);
router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

// Google OAuth — only register routes if credentials are configured
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE"
) {
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/login?error=google_oauth_failed`,
      session: true,
    }),
    googleCallback
  );
} else {
  // If not configured, return a helpful message
  router.get("/google", (req, res) => {
    res.status(503).json({
      message: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
    });
  });
}

module.exports = router;
