import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // On mount: try to restore user from localStorage or /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = localStorage.getItem("doodle_user");
      const token = localStorage.getItem("doodle_token");

      if (savedUser && token) {
        try {
          // Verify token is still valid with server
          const { data } = await api.get("/api/auth/me");
          setUser(data);
        } catch {
          // Token invalid — clear everything
          localStorage.removeItem("doodle_token");
          localStorage.removeItem("doodle_user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("doodle_user", JSON.stringify(userData));
    localStorage.setItem("doodle_token", token);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("doodle_token");
      localStorage.removeItem("doodle_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
