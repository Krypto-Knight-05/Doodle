import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CanvasBoard from "../components/CanvasBoard";
import Toolbar from "../components/Toolbar";
import PropertiesPanel from "../components/PropertiesPanel";

const SOCKET_URL = "http://localhost:4444";

const DEFAULT_PROPERTIES = {
  strokeColor: "#000000",
  fillColor: "transparent",
  strokeWidth: 2,
  opacity: 1,
  fontSize: 18,
};

const BoardPage = () => {
  const { boardId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tool, setTool] = useState("pen");
  const [elements, setElements] = useState([]);
  const [title, setTitle] = useState("Untitled Drawing");
  const [properties, setProperties] = useState(DEFAULT_PROPERTIES);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // History for undo/redo (tracked in CanvasBoard via refs)
  // We expose undo/redo via events to Toolbar
  const historyRef = useRef({ items: [[]], index: 0 });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const socketRef = useRef(null);
  const titleSaveTimer = useRef(null);
  const thumbnailTimer = useRef(null);
  const canvasRef = useRef(null); // reference to canvas DOM node for export

  const token = localStorage.getItem("doodle_token");

  // ── Connect to Socket.IO ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-board", { boardId });
    });

    socket.on("board-init", ({ title: t, elements: els }) => {
      setTitle(t);
      setElements(els || []);
      setLoading(false);
    });

    socket.on("board-error", ({ message }) => {
      console.error("Board error:", message);
      setLoading(false);
    });

    return () => socket.disconnect();
  }, [boardId, token]);

  // ── Load board from API (fallback if socket is slow) ─────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/api/boards/${boardId}`);
        setTitle(data.title);
        setElements(data.elements || []);
      } catch (err) {
        console.error("Board load error:", err);
        if (err.response?.status === 404) navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [boardId]);

  // ── Save elements via Socket ──────────────────────────────────────────────
  const saveElements = useCallback((els) => {
    socketRef.current?.emit("elements-update", { boardId, elements: els });
    scheduleThumbnail(els);
  }, [boardId]);

  // ── Thumbnail: capture canvas 5s after last draw ──────────────────────────
  const scheduleThumbnail = useCallback((els) => {
    clearTimeout(thumbnailTimer.current);
    thumbnailTimer.current = setTimeout(async () => {
      // Find the canvas element
      const canvas = document.querySelector(".canvas-container canvas");
      if (!canvas) return;
      try {
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = 600;
        thumbCanvas.height = 400;
        const tCtx = thumbCanvas.getContext("2d");
        tCtx.fillStyle = "#ffffff";
        tCtx.fillRect(0, 0, 600, 400);
        tCtx.drawImage(canvas, 0, 0, 600, 400);
        const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);
        await api.patch(`/api/boards/${boardId}/thumbnail`, { thumbnail });
      } catch (err) {
        console.error("Thumbnail save error:", err);
      }
    }, 5000);
  }, [boardId]);

  // ── Title save (debounced) ────────────────────────────────────────────────
  const handleTitleChange = (val) => {
    setTitle(val);
    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(async () => {
      try {
        await api.patch(`/api/boards/${boardId}/title`, { title: val });
      } catch (err) {
        console.error("Title save error:", err);
      }
    }, 1000);
  };

  // ── Export as PNG ─────────────────────────────────────────────────────────
  const handleExport = () => {
    const canvas = document.querySelector(".canvas-container canvas");
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");
    ctx.fillStyle = "#1a1a22"; // dark background
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `${title || "doodle"}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // ── Clear canvas ─────────────────────────────────────────────────────────
  const handleClear = () => {
    if (elements.length === 0) return;
    if (!window.confirm("Clear the canvas? This will be saved as an undo step.")) return;
    setElements([]);
    saveElements([]);
  };

  // ── Undo / Redo (passed to Toolbar, actual logic in CanvasBoard) ──────────
  // We dispatch keyboard events since CanvasBoard handles them
  const handleUndo = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "z", bubbles: true }));
  };
  const handleRedo = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { ctrlKey: true, key: "y", bubbles: true }));
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading your canvas...</span>
      </div>
    );
  }

  return (
    <div className="board-layout">
      {/* ── Header ── */}
      <header className="board-header">
        <div className="board-header-left">
          <Link to="/dashboard" className="board-back-btn">
            ← Dashboard
          </Link>
          <input
            className="board-title-input"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            maxLength={60}
            title="Click to rename"
          />
        </div>

        {/* Center: status indicator */}
        <div className="board-header-center">
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            ✓ Auto-saved
          </span>
        </div>

        <div className="board-header-right">
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            style={{ fontSize: "0.82rem", padding: "7px 12px" }}
          >
            🗑️ Clear
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            style={{ fontSize: "0.82rem", padding: "7px 14px" }}
          >
            📸 Export PNG
          </button>
        </div>
      </header>

      {/* ── Canvas area with floating panels ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>
        {/* Left toolbar */}
        <Toolbar
          activeTool={tool}
          setActiveTool={setTool}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={true}
          canRedo={true}
        />

        {/* Canvas */}
        <div className="canvas-container" style={{ flex: 1 }}>
          <CanvasBoard
            elements={elements}
            setElements={setElements}
            tool={tool}
            properties={properties}
            onSave={saveElements}
          />
        </div>

        {/* Right properties panel */}
        <PropertiesPanel properties={properties} onChange={setProperties} />
      </div>
    </div>
  );
};

export default BoardPage;
