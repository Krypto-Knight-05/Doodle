const mongoose = require("mongoose");

// Sub-schema for individual drawing elements
const ElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },         // uuid from client
    type: { type: String, required: true },        // pen | line | rectangle | ellipse | triangle | arrow | text
    // Shape-based elements (rectangle, ellipse, triangle)
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    // Line / Arrow: two endpoints
    x1: { type: Number },
    y1: { type: Number },
    x2: { type: Number },
    y2: { type: Number },
    // Pen: array of points
    points: { type: [{ x: Number, y: Number }], default: undefined },
    // Styling
    strokeColor: { type: String, default: "#000000" },
    fillColor: { type: String, default: "transparent" },
    strokeWidth: { type: Number, default: 2 },
    opacity: { type: Number, default: 1 },
    // Text element
    text: { type: String },
    fontSize: { type: Number, default: 18 },
    fontFamily: { type: String, default: "Inter, sans-serif" },
  },
  { _id: false }
);

const BoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      default: "Untitled Drawing",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    elements: {
      type: [ElementSchema],
      default: [],
    },
    thumbnail: {
      type: String,   // base64 data URL, updated on save
      default: null,
    },
  },
  { timestamps: true }
);

const Board = mongoose.model("Board", BoardSchema);
module.exports = Board;
