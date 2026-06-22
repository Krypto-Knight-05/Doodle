import React from "react";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
  "#6c63ff", "#34d399", "#fbbf24", "#60a5fa", "#f472b6",
];

const PropertiesPanel = ({ properties, onChange }) => {
  const update = (key, val) => onChange({ ...properties, [key]: val });

  return (
    <div className="properties-panel">
      <div className="panel-title">Properties</div>

      {/* Stroke Color */}
      <div className="prop-row">
        <div className="prop-label">Stroke Color</div>
        <div className="prop-color-row">
          <div className="color-swatch">
            <input
              type="color"
              value={properties.strokeColor}
              onChange={(e) => update("strokeColor", e.target.value)}
              title="Stroke color"
            />
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {properties.strokeColor}
          </span>
        </div>
        <div className="color-presets">
          {PRESET_COLORS.map((c) => (
            <div
              key={c}
              className={`color-preset ${properties.strokeColor === c ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => update("strokeColor", c)}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Fill Color */}
      <div className="prop-row">
        <div className="prop-label">Fill Color</div>
        <div className="prop-color-row">
          <div className="color-swatch" style={{ position: "relative" }}>
            {properties.fillColor === "transparent" ? (
              <div
                onClick={() => update("fillColor", "#ffffff20")}
                style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, white 25%, white 75%, #ccc 75%)",
                  backgroundSize: "8px 8px", backgroundPosition: "0 0, 4px 4px",
                  cursor: "pointer", borderRadius: "4px",
                }}
                title="No fill (click to add)"
              />
            ) : (
              <input
                type="color"
                value={properties.fillColor.length === 7 ? properties.fillColor : "#ffffff"}
                onChange={(e) => update("fillColor", e.target.value)}
                title="Fill color"
              />
            )}
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.7rem", padding: "3px 6px", height: "auto" }}
            onClick={() =>
              update("fillColor", properties.fillColor === "transparent" ? "#ffffff" : "transparent")
            }
          >
            {properties.fillColor === "transparent" ? "None" : "Clear"}
          </button>
        </div>
      </div>

      {/* Stroke Width */}
      <div className="prop-row">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="prop-label">Stroke Width</span>
          <span className="prop-value">{properties.strokeWidth}px</span>
        </div>
        <input
          className="prop-range"
          type="range"
          min="1"
          max="20"
          step="1"
          value={properties.strokeWidth}
          onChange={(e) => update("strokeWidth", Number(e.target.value))}
        />
      </div>

      {/* Opacity */}
      <div className="prop-row">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="prop-label">Opacity</span>
          <span className="prop-value">{Math.round(properties.opacity * 100)}%</span>
        </div>
        <input
          className="prop-range"
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={properties.opacity}
          onChange={(e) => update("opacity", Number(e.target.value))}
        />
      </div>

      {/* Font Size (only relevant for text tool) */}
      <div className="prop-row">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="prop-label">Font Size</span>
          <span className="prop-value">{properties.fontSize}px</span>
        </div>
        <input
          className="prop-range"
          type="range"
          min="10"
          max="72"
          step="2"
          value={properties.fontSize}
          onChange={(e) => update("fontSize", Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export default PropertiesPanel;
