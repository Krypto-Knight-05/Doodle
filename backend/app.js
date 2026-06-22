require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);
const passport = require("passport");

const connectDB = require("./config/db");
require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const boardRoutes = require("./routes/boardRoutes");
const Board = require("./models/boardModel");
const { requireAuth } = require("./middleware/authMiddleware");

const app = express();

// Session store in MongoDB
const store = new MongoStore({
  uri: process.env.DB_URL,
  collection: "sessions",
});
store.on("error", (err) => console.error("Session store error:", err));

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "doodle-secret",
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "Doodle API running 🎨" }));

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
});

// Socket.IO: Verify JWT on connection via handshake query
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));
  const jwt = require("jsonwebtoken");
  const User = require("./models/userModel");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "doodle-jwt-secret");
    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) return next(new Error("User not found"));
    socket.user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id} (user: ${socket.user?.name})`);

  socket.on("join-board", async ({ boardId }) => {
    if (!boardId) return;
    try {
      const board = await Board.findOne({ _id: boardId, ownerId: socket.user._id });
      if (!board) return socket.emit("board-error", { message: "Board not found or access denied" });

      socket.join(boardId);
      socket.emit("board-init", {
        boardId: board._id,
        title: board.title,
        elements: board.elements || [],
      });
    } catch (err) {
      console.error("join-board error:", err);
      socket.emit("board-error", { message: "Server error" });
    }
  });

  socket.on("elements-update", async ({ boardId, elements }) => {
    if (!boardId || !Array.isArray(elements)) return;
    try {
      await Board.findOneAndUpdate(
        { _id: boardId, ownerId: socket.user._id },
        { elements, updatedAt: new Date() }
      );
    } catch (err) {
      console.error("elements-update error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 4444;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Doodle server running on http://localhost:${PORT}`);
  });
});
