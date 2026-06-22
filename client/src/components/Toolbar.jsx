import React from "react";

// Tool definitions
const TOOLS = [
  { id: "select",    icon: "⬡", label: "Select (V)",    group: 1 },
  { id: "pen",       icon: "✏️",  label: "Pen (P)",       group: 1 },
  { id: "line",      icon: "╱",  label: "Line (L)",      group: 2 },
  { id: "arrow",     icon: "→",  label: "Arrow (A)",     group: 2 },
  { id: "rectangle", icon: "▭",  label: "Rectangle (R)", group: 2 },
  { id: "ellipse",   icon: "⬭",  label: "Ellipse (E)",   group: 2 },
  { id: "triangle",  icon: "△",  label: "Triangle (T)",  group: 2 },
  { id: "text",      icon: "T",  label: "Text (X)",      group: 3 },
  { id: "eraser",    icon: "⌫",  label: "Eraser (Del)",  group: 3 },
];

const Toolbar = ({ activeTool, setActiveTool, onUndo, onRedo, canUndo, canRedo }) => {
  // Keyboard shortcuts for tool switching
  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const map = {
        v: "select", p: "pen", l: "line", a: "arrow",
        r: "rectangle", e: "ellipse", t: "triangle", x: "text",
      };
      if (map[e.key.toLowerCase()]) {
        setActiveTool(map[e.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setActiveTool]);

  let lastGroup = null;
  return (
    <div className="toolbar">
      {TOOLS.map((tool) => {
        const showDivider = lastGroup !== null && tool.group !== lastGroup;
        lastGroup = tool.group;
        return (
          <React.Fragment key={tool.id}>
            {showDivider && <div className="toolbar-divider" />}
            <button
              id={`tool-${tool.id}`}
              className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
            >
              <span style={{ fontSize: tool.id === "text" ? "0.9rem" : "1rem", fontWeight: tool.id === "text" ? "800" : "normal" }}>
                {tool.icon}
              </span>
              <span className="tooltip">{tool.label}</span>
            </button>
          </React.Fragment>
        );
      })}

      <div className="toolbar-divider" />

      {/* Undo */}
      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.35 }}
      >
        ↩
        <span className="tooltip">Undo (Ctrl+Z)</span>
      </button>

      {/* Redo */}
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        style={{ opacity: canRedo ? 1 : 0.35 }}
      >
        ↪
        <span className="tooltip">Redo (Ctrl+Y)</span>
      </button>
    </div>
  );
};

export default Toolbar;
