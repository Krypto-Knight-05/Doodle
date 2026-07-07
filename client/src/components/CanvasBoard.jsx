import React, { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────────────────────────────────────
// Drawing utilities
// ─────────────────────────────────────────────────────────────────────────────

function drawElement(ctx, el, isSelected = false) {
  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;
  ctx.strokeStyle = el.strokeColor || "#000000";
  ctx.fillStyle = el.fillColor || "transparent";
  ctx.lineWidth = el.strokeWidth || 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (isSelected) {
    ctx.shadowColor = "#6c63ff";
    ctx.shadowBlur = 10;
  }

  switch (el.type) {
    case "pen": {
      const pts = el.points || [];
      if (pts.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      // Smooth bezier
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
      break;
    }

    case "line": {
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      break;
    }

    case "arrow": {
      const dx = el.x2 - el.x1;
      const dy = el.y2 - el.y1;
      const angle = Math.atan2(dy, dx);
      const headLen = Math.min(20, Math.sqrt(dx * dx + dy * dy) * 0.3);
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();
      // arrowhead
      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(
        el.x2 - headLen * Math.cos(angle - Math.PI / 6),
        el.y2 - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(
        el.x2 - headLen * Math.cos(angle + Math.PI / 6),
        el.y2 - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    }

    case "rectangle": {
      const w = el.width || 0, h = el.height || 0;
      if (el.fillColor && el.fillColor !== "transparent") {
        ctx.fillRect(el.x, el.y, w, h);
      }
      ctx.strokeRect(el.x, el.y, w, h);
      break;
    }

    case "ellipse": {
      const w = el.width || 0, h = el.height || 0;
      const cx = el.x + w / 2, cy = el.y + h / 2;
      const rx = Math.abs(w) / 2, ry = Math.abs(h) / 2;
      if (rx === 0 || ry === 0) break;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      if (el.fillColor && el.fillColor !== "transparent") ctx.fill();
      ctx.stroke();
      break;
    }

    case "triangle": {
      const w = el.width || 0, h = el.height || 0;
      ctx.beginPath();
      ctx.moveTo(el.x + w / 2, el.y);
      ctx.lineTo(el.x + w, el.y + h);
      ctx.lineTo(el.x, el.y + h);
      ctx.closePath();
      if (el.fillColor && el.fillColor !== "transparent") ctx.fill();
      ctx.stroke();
      break;
    }

    case "text": {
      const fontSize = el.fontSize || 18;
      ctx.font = `${fontSize}px ${el.fontFamily || "Inter, sans-serif"}`;
      ctx.fillStyle = el.strokeColor || "#000000";
      ctx.globalAlpha = el.opacity ?? 1;
      const lines = (el.text || "").split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, el.x, el.y + fontSize + i * (fontSize * 1.3));
      });
      break;
    }

    default: break;
  }

  ctx.restore();

  // Selection handles
  if (isSelected) {
    drawSelectionHandles(ctx, el);
  }
}

function drawSelectionHandles(ctx, el) {
  const bb = getBoundingBox(el);
  if (!bb) return;
  const { x, y, w, h } = bb;
  ctx.save();
  ctx.strokeStyle = "#6c63ff";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
  ctx.setLineDash([]);
  // Corner dots
  const corners = [
    [x - 4, y - 4], [x + w + 4, y - 4],
    [x - 4, y + h + 4], [x + w + 4, y + h + 4],
  ];
  ctx.fillStyle = "#6c63ff";
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function getBoundingBox(el) {
  if (!el) return null;
  switch (el.type) {
    case "pen": {
      const pts = el.points || [];
      if (pts.length === 0) return null;
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case "line":
    case "arrow": {
      const x = Math.min(el.x1, el.x2), y = Math.min(el.y1, el.y2);
      return { x, y, w: Math.abs(el.x2 - el.x1), h: Math.abs(el.y2 - el.y1) };
    }
    case "rectangle":
    case "ellipse":
    case "triangle": {
      const x = el.width < 0 ? el.x + el.width : el.x;
      const y = el.height < 0 ? el.y + el.height : el.y;
      return { x, y, w: Math.abs(el.width || 0), h: Math.abs(el.height || 0) };
    }
    case "text": {
      const w = ((el.text || "").length * (el.fontSize || 18)) / 1.6;
      const lines = (el.text || "").split("\n").length;
      return { x: el.x, y: el.y, w, h: lines * (el.fontSize || 18) * 1.3 };
    }
    default: return null;
  }
}

function hitTest(el, x, y) {
  const bb = getBoundingBox(el);
  if (!bb) return false;
  const pad = (el.strokeWidth || 2) + 4;
  return (
    x >= bb.x - pad && x <= bb.x + bb.w + pad &&
    y >= bb.y - pad && y <= bb.y + bb.h + pad
  );
}

function moveElement(el, dx, dy) {
  switch (el.type) {
    case "pen":
      return { ...el, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case "line":
    case "arrow":
      return { ...el, x1: el.x1 + dx, y1: el.y1 + dy, x2: el.x2 + dx, y2: el.y2 + dy };
    default:
      return { ...el, x: el.x + dx, y: el.y + dy };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CanvasBoard Component
// ─────────────────────────────────────────────────────────────────────────────

const CanvasBoard = ({
  elements,
  setElements,
  tool,
  properties,  // { strokeColor, fillColor, strokeWidth, opacity, fontSize }
  onSave,      // called when drawing ends (for thumbnail/sync)
}) => {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const currentId = useRef(null);
  const dragStart = useRef(null); // { x, y, elementSnapshot }
  const textInputRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const [textInput, setTextInput] = useState(null); // { x, y, id }

  // ── History for undo/redo ──────────────────────────────────────────────────
  const history = useRef([[]]);
  const historyIndex = useRef(0);

  const pushHistory = useCallback((newElements) => {
    // Trim future states
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(newElements);
    historyIndex.current = history.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndex.current <= 0) return;
    historyIndex.current--;
    setElements(history.current[historyIndex.current]);
  }, [setElements]);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;
    historyIndex.current++;
    setElements(history.current[historyIndex.current]);
  }, [setElements]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z") { e.preventDefault(); undo(); }
      if (ctrl && (e.key === "y" || (e.shiftKey && e.key === "z"))) { e.preventDefault(); redo(); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          setElements((prev) => {
            const next = prev.filter((el) => el.id !== selectedId);
            pushHistory(next);
            return next;
          });
          setSelectedId(null);
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setTextInput(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, selectedId, pushHistory]);

  // ── Redraw canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    elements.forEach((el) => drawElement(ctx, el, el.id === selectedId));
  }, [elements, selectedId]);

  // ── Resize canvas to fill container ───────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      // Save existing drawing
      const imgData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").putImageData(imgData, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── Mouse coords relative to canvas ───────────────────────────────────────
  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Support touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // ── Create new element based on current tool ───────────────────────────────
  const createNewElement = (x, y) => {
    const id = uuidv4();
    const base = {
      id,
      strokeColor: properties.strokeColor,
      fillColor: properties.fillColor,
      strokeWidth: properties.strokeWidth,
      opacity: properties.opacity,
    };

    if (tool === "pen") return { ...base, type: "pen", points: [{ x, y }] };
    if (tool === "line") return { ...base, type: "line", x1: x, y1: y, x2: x, y2: y };
    if (tool === "arrow") return { ...base, type: "arrow", x1: x, y1: y, x2: x, y2: y };
    if (tool === "rectangle") return { ...base, type: "rectangle", x, y, width: 0, height: 0 };
    if (tool === "ellipse") return { ...base, type: "ellipse", x, y, width: 0, height: 0 };
    if (tool === "triangle") return { ...base, type: "triangle", x, y, width: 0, height: 0 };
    return null;
  };

  // ── Mouse Down ─────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || e.button === 2) return; // ignore middle/right click
    const { x, y } = getCoords(e);

    // Text tool: place a text input overlay
    if (tool === "text") {
      setSelectedId(null);
      setTextInput({ x, y, id: uuidv4() });
      return;
    }

    // Select tool: hit test elements (reverse = topmost first)
    if (tool === "select") {
      const hit = [...elements].reverse().find((el) => hitTest(el, x, y));
      if (hit) {
        setSelectedId(hit.id);
        dragStart.current = { x, y, elementId: hit.id };
      } else {
        setSelectedId(null);
        dragStart.current = null;
      }
      return;
    }

    // Eraser: erase element under cursor
    if (tool === "eraser") {
      isDrawing.current = true;
      return;
    }

    // Drawing tools
    const newEl = createNewElement(x, y);
    if (!newEl) return;

    currentId.current = newEl.id;
    isDrawing.current = true;
    setElements((prev) => [...prev, newEl]);
  }, [tool, elements, properties, createNewElement]);

  // ── Mouse Move ─────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    const { x, y } = getCoords(e);

    // Drag selected element
    if (tool === "select" && dragStart.current) {
      const { x: sx, y: sy, elementId } = dragStart.current;
      const dx = x - sx, dy = y - sy;
      setElements((prev) =>
        prev.map((el) => (el.id === elementId ? moveElement(el, dx, dy) : el))
      );
      dragStart.current = { x, y, elementId };
      return;
    }

    if (!isDrawing.current) return;

    // Eraser
    if (tool === "eraser") {
      setElements((prev) => prev.filter((el) => !hitTest(el, x, y)));
      return;
    }

    // Update current element
    if (!currentId.current) return;
    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== currentId.current) return el;
        if (el.type === "pen") {
          return { ...el, points: [...el.points, { x, y }] };
        }
        if (el.type === "line" || el.type === "arrow") {
          // Snap to 45° increments if Shift held
          if (e.shiftKey) {
            const dx = x - el.x1, dy = y - el.y1;
            const angle = Math.atan2(dy, dx);
            const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const len = Math.sqrt(dx * dx + dy * dy);
            return { ...el, x2: el.x1 + Math.cos(snapped) * len, y2: el.y1 + Math.sin(snapped) * len };
          }
          return { ...el, x2: x, y2: y };
        }
        // Shape elements
        let w = x - el.x, h = y - el.y;
        if (e.shiftKey) { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w) * s; h = Math.sign(h) * s; }
        return { ...el, width: w, height: h };
      })
    );
  }, [tool]);

  // ── Mouse Up ───────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current && !dragStart.current) return;

    if (isDrawing.current) {
      // Push to history
      setElements((prev) => {
        // Remove tiny/empty elements
        const filtered = prev.filter((el) => {
          if (el.type === "pen") return el.points.length > 1;
          if (["rectangle", "ellipse", "triangle"].includes(el.type)) return Math.abs(el.width) > 2 || Math.abs(el.height) > 2;
          if (["line", "arrow"].includes(el.type)) return Math.hypot(el.x2 - el.x1, el.y2 - el.y1) > 2;
          return true;
        });
        pushHistory(filtered);
        onSave?.(filtered);
        return filtered;
      });
    }

    if (dragStart.current) {
      setElements((prev) => {
        pushHistory(prev);
        onSave?.(prev);
        return prev;
      });
    }

    isDrawing.current = false;
    currentId.current = null;
    dragStart.current = null;
  }, [pushHistory, onSave]);

  // ── Text Input: confirm text element ──────────────────────────────────────
  const confirmText = useCallback(() => {
    if (!textInput) return;
    const val = textInputRef.current?.value?.trim();
    if (val) {
      const newEl = {
        id: textInput.id,
        type: "text",
        x: textInput.x,
        y: textInput.y,
        text: val,
        fontSize: properties.fontSize || 18,
        fontFamily: "Inter, sans-serif",
        strokeColor: properties.strokeColor,
        opacity: properties.opacity,
      };
      setElements((prev) => {
        const next = [...prev, newEl];
        pushHistory(next);
        onSave?.(next);
        return next;
      });
    }
    setTextInput(null);
  }, [textInput, properties, pushHistory, onSave]);

  // ── Canvas cursor class ────────────────────────────────────────────────────
  const getCursorClass = () => {
    if (tool === "select") return "cursor-select";
    if (tool === "pen") return "cursor-pen";
    if (tool === "eraser") return "cursor-eraser";
    if (tool === "text") return "cursor-text";
    return "";
  };

  return (
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
      <canvas
        ref={canvasRef}
        className={getCursorClass()}
        style={{ display: "block", width: "100%", height: "100%" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => { e.preventDefault(); handleMouseDown(e); }}
        onTouchMove={(e) => { e.preventDefault(); handleMouseMove(e); }}
        onTouchEnd={handleMouseUp}
      />

      {/* Text input overlay */}
      {textInput && (
        <textarea
          ref={textInputRef}
          className="text-input-overlay"
          autoFocus
          style={{
            left: textInput.x,
            top: textInput.y,
            fontSize: `${properties.fontSize || 18}px`,
            color: properties.strokeColor,
          }}
          onBlur={confirmText}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setTextInput(null); }
            // Ctrl+Enter confirms
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { confirmText(); }
          }}
          placeholder="Type here..."
          rows={1}
        />
      )}
    </div>
  );
};

// Export undo/redo via imperative handle if needed (handled via keyboard shortcuts)
export default CanvasBoard;
