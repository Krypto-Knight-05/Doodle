import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const { data } = await api.get("/api/boards");
      setBoards(data);
    } catch (err) {
      console.error("Failed to load boards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewBoard = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/api/boards", { title: "Untitled Drawing" });
      navigate(`/board/${data._id}`);
    } catch (err) {
      console.error("Failed to create board:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, boardId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this drawing? This cannot be undone.")) return;
    try {
      await api.delete(`/api/boards/${boardId}`);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  const handleRename = async (boardId) => {
    if (!renameVal.trim()) return setRenamingId(null);
    try {
      const { data } = await api.patch(`/api/boards/${boardId}/title`, {
        title: renameVal.trim(),
      });
      setBoards((prev) =>
        prev.map((b) => (b._id === boardId ? { ...b, title: data.title } : b))
      );
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setRenamingId(null);
    }
  };

  const startRename = (e, board) => {
    e.stopPropagation();
    setRenamingId(board._id);
    setRenameVal(board.title);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getInitial = (name) => (name ? name[0].toUpperCase() : "?");

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="dashboard-logo-icon">✏️</div>
          Doodle
        </div>

        <div className="dashboard-user">
          <div className="user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
            ) : (
              getInitial(user?.name)
            )}
          </div>
          <span className="user-name">{user?.name}</span>
          <button
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ padding: "7px 14px", fontSize: "0.82rem" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="dashboard-main">
        <h1 className="dashboard-welcome">
          Welcome back, <span>{user?.name?.split(" ")[0]}</span>! 👋
        </h1>
        <p className="dashboard-sub">
          Pick up where you left off, or start something new.
        </p>

        <div className="boards-section-header">
          <h2 className="boards-section-title">Your Drawings</h2>
          <button className="btn btn-primary" onClick={handleNewBoard} disabled={creating}>
            {creating ? "Creating..." : "+ New Drawing"}
          </button>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ height: "300px" }}>
            <div className="spinner" />
          </div>
        ) : (
          <div className="boards-grid">
            {/* New Board Card */}
            <div className="new-board-card" onClick={handleNewBoard}>
              <div className="new-board-icon">+</div>
              <div className="new-board-text">New Drawing</div>
            </div>

            {boards.length === 0 && (
              <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
                <div className="empty-state-icon">🎨</div>
                <h3 className="empty-state-title">No drawings yet</h3>
                <p>Click "New Drawing" to create your first masterpiece!</p>
              </div>
            )}

            {boards.map((board) => (
              <div
                key={board._id}
                className="board-card"
                onClick={() => navigate(`/board/${board._id}`)}
              >
                {/* Thumbnail */}
                <div className="board-thumbnail">
                  {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.title} />
                  ) : (
                    <span className="board-thumbnail-placeholder">🖼️</span>
                  )}
                </div>

                {/* Actions */}
                <div className="board-card-actions">
                  <button
                    className="board-action-btn"
                    onClick={(e) => startRename(e, board)}
                    title="Rename"
                    style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
                  >
                    ✏️
                  </button>
                  <button
                    className="board-action-btn delete"
                    onClick={(e) => handleDelete(e, board._id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>

                {/* Body */}
                <div className="board-card-body">
                  {renamingId === board._id ? (
                    <input
                      className="form-input"
                      style={{ padding: "4px 8px", fontSize: "0.9rem", marginBottom: "4px" }}
                      value={renameVal}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onBlur={() => handleRename(board._id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(board._id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                    />
                  ) : (
                    <div className="board-card-title">{board.title}</div>
                  )}
                  <div className="board-card-meta">
                    Updated {formatDate(board.updatedAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
