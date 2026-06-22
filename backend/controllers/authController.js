const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { z } = require("zod");
const User = require("../models/userModel");

// ── Zod validation schemas ──────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── Helpers ─────────────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId.toString() },
    process.env.JWT_SECRET || "doodle-jwt-secret",
    { expiresIn: "7d" }
  );
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

// ── Controllers ──────────────────────────────────────────────────────────────

// POST /api/auth/register
module.exports.register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || "Invalid input";
      return res.status(400).json({ message: msg });
    }

    const { name, email, password } = parsed.data;

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    // Log the user into passport session
    req.logIn(user, (err) => {
      if (err) console.error("Session error after register:", err);
    });

    const token = generateToken(user._id);
    return res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// POST /api/auth/login
module.exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || "Invalid credentials." });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      const token = generateToken(user._id);
      return res.json({ token, user: formatUser(user) });
    });
  })(req, res, next);
};

// POST /api/auth/logout
module.exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed." });
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully." });
    });
  });
};

// GET /api/auth/me
module.exports.me = (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated." });
  return res.json(formatUser(req.user));
};

// GET /api/auth/google/callback → redirect with token
module.exports.googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  const clientURL = process.env.CORS_ORIGIN || "http://localhost:5173";
  // Redirect to frontend success page with token in query param
  res.redirect(`${clientURL}/auth/google/success?token=${token}`);
};
