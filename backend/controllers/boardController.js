const Board = require("../models/boardModel");

// GET /api/boards — all boards for current user (dashboard)
module.exports.getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ ownerId: req.user._id })
      .select("title thumbnail createdAt updatedAt")
      .sort({ updatedAt: -1 });
    return res.json(boards);
  } catch (err) {
    console.error("getBoards error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/boards — create new board
module.exports.createBoard = async (req, res) => {
  try {
    const { title } = req.body;
    const board = await Board.create({
      title: title?.trim() || "Untitled Drawing",
      ownerId: req.user._id,
      elements: [],
    });
    return res.status(201).json(board);
  } catch (err) {
    console.error("createBoard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/boards/:boardId — single board (owner only)
module.exports.getBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findOne({ _id: boardId, ownerId: req.user._id });
    if (!board) {
      return res.status(404).json({ message: "Board not found." });
    }
    return res.json(board);
  } catch (err) {
    console.error("getBoard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/boards/:boardId/title — rename board
module.exports.updateTitle = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title cannot be empty." });
    }
    const board = await Board.findOneAndUpdate(
      { _id: boardId, ownerId: req.user._id },
      { title: title.trim() },
      { new: true, select: "title updatedAt" }
    );
    if (!board) return res.status(404).json({ message: "Board not found." });
    return res.json(board);
  } catch (err) {
    console.error("updateTitle error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/boards/:boardId/thumbnail — save thumbnail (base64 data URL)
module.exports.updateThumbnail = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { thumbnail } = req.body;
    await Board.findOneAndUpdate(
      { _id: boardId, ownerId: req.user._id },
      { thumbnail }
    );
    return res.json({ message: "Thumbnail saved." });
  } catch (err) {
    console.error("updateThumbnail error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/boards/:boardId — delete board
module.exports.deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const result = await Board.findOneAndDelete({ _id: boardId, ownerId: req.user._id });
    if (!result) return res.status(404).json({ message: "Board not found." });
    return res.json({ message: "Board deleted." });
  } catch (err) {
    console.error("deleteBoard error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
