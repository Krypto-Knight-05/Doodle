const express = require("express");
const {
  getBoards,
  createBoard,
  getBoard,
  updateTitle,
  updateThumbnail,
  deleteBoard,
} = require("../controllers/boardController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// All board routes require authentication
router.use(requireAuth);

router.get("/", getBoards);             // GET  /api/boards/
router.post("/", createBoard);          // POST /api/boards/
router.get("/:boardId", getBoard);      // GET  /api/boards/:boardId
router.patch("/:boardId/title", updateTitle);           // PATCH /api/boards/:boardId/title
router.patch("/:boardId/thumbnail", updateThumbnail);   // PATCH /api/boards/:boardId/thumbnail
router.delete("/:boardId", deleteBoard);                // DELETE /api/boards/:boardId

module.exports = router;
