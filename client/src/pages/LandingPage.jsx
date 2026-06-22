import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-nav-logo-icon">✏️</div>
          Doodle
        </div>
        <div className="landing-nav-actions">
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <h1 className="hero-title fade-in-up">
          Draw anything,<br />
          <span className="accent">save it forever</span>
        </h1>
        <p className="hero-subtitle fade-in-up delay-1">
          A simple canvas tool for sketching ideas, drawing shapes, and adding text.
          Sign up to save your work and access it from anywhere.
        </p>
        <div className="hero-actions fade-in-up delay-2">
          {user ? (
            <button className="btn btn-primary" onClick={() => navigate("/dashboard")}>
              Open Dashboard
            </button>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
              <Link to="/login" className="btn btn-secondary">Sign In</Link>
            </>
          )}
        </div>

        {/* Animated canvas preview */}
        <div className="hero-canvas-preview fade-in-up delay-3">
          <AnimatedPreviewCanvas />
        </div>
      </section>
    </div>
  );
};

/* Animated canvas preview */
const AnimatedPreviewCanvas = () => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const W = canvas.width;
    const H = canvas.height;

    // A set of pre-defined "drawing" elements that animate in and float
    const elements = [
      // Rectangles
      { type: "rect",    x: 60,       y: 60,  w: 140, h: 90,  color: "#5c55e8", phase: 0 },
      { type: "rect",    x: W - 220,  y: 50,  w: 110, h: 70,  color: "#ec4899", phase: 1.2 },
      { type: "rect",    x: W - 180,  y: H - 120, w: 130, h: 80, color: "#10b981", phase: 2.4 },
      // Ellipses
      { type: "ellipse", x: W / 2 - 60, y: 50, rx: 70, ry: 40, color: "#f59e0b", phase: 0.8 },
      { type: "ellipse", x: 80,  y: H - 110, rx: 55, ry: 38, color: "#3b82f6", phase: 1.8 },
      { type: "ellipse", x: W / 2 + 30, y: H - 90, rx: 80, ry: 35, color: "#8b5cf6", phase: 3.0 },
      // Lines
      { type: "line",    x1: 220, y1: 80,  x2: 380, y2: 160, color: "#5c55e8", phase: 0.5 },
      { type: "line",    x1: W - 260, y1: H - 80, x2: W - 100, y2: H - 40, color: "#ec4899", phase: 2.0 },
      // Freehand squiggle — stored as points
      {
        type: "squiggle",
        points: Array.from({ length: 30 }, (_, i) => ({
          x: 60 + (W - 120) * (i / 29),
          y: H / 2,
        })),
        color: "#5c55e8",
        phase: 0,
      },
    ];

    let frame = 0;
    let raf;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // Draw dot grid background
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      for (let gx = 20; gx < W; gx += 24) {
        for (let gy = 20; gy < H; gy += 24) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      elements.forEach((el) => {
        const bob = Math.sin(frame * 0.015 + el.phase) * 6;
        ctx.save();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.85;

        if (el.type === "rect") {
          // Filled with light tint + stroke
          ctx.fillStyle = el.color + "18"; // ~10% opacity fill
          ctx.beginPath();
          ctx.roundRect(el.x, el.y + bob, el.w, el.h, 8);
          ctx.fill();
          ctx.stroke();
        } else if (el.type === "ellipse") {
          ctx.fillStyle = el.color + "18";
          ctx.beginPath();
          ctx.ellipse(el.x, el.y + bob, el.rx, el.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (el.type === "line") {
          ctx.beginPath();
          ctx.moveTo(el.x1, el.y1 + bob);
          ctx.lineTo(el.x2, el.y2 + bob);
          ctx.stroke();
          // arrow tip
          const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
          const hl = 14;
          ctx.beginPath();
          ctx.moveTo(el.x2, el.y2 + bob);
          ctx.lineTo(el.x2 - hl * Math.cos(angle - 0.45), el.y2 + bob - hl * Math.sin(angle - 0.45));
          ctx.moveTo(el.x2, el.y2 + bob);
          ctx.lineTo(el.x2 - hl * Math.cos(angle + 0.45), el.y2 + bob - hl * Math.sin(angle + 0.45));
          ctx.stroke();
        } else if (el.type === "squiggle") {
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y + bob);
          for (let i = 1; i < el.points.length - 1; i++) {
            const mx = (el.points[i].x + el.points[i + 1].x) / 2;
            const my = ((el.points[i].y + el.points[i + 1].y) / 2) +
              Math.sin((i / el.points.length) * Math.PI * 3 + frame * 0.04) * 22 + bob;
            ctx.quadraticCurveTo(el.points[i].x, el.points[i].y + Math.sin((i / el.points.length) * Math.PI * 3 + frame * 0.04) * 22 + bob, mx, my);
          }
          ctx.stroke();
        }

        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height: "100%", background: "#ffffff" }}
    />
  );
};

export default LandingPage;
