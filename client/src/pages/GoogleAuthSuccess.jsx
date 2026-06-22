import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

/**
 * This page handles the redirect from Google OAuth callback.
 * The backend redirects here with ?token=<jwt>
 */
const GoogleAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login?error=no_token");
      return;
    }

    // Store token first so axios interceptor sends it
    localStorage.setItem("doodle_token", token);

    // Fetch user info using the token
    api
      .get("/api/auth/me")
      .then(({ data }) => {
        login(data, token);
        navigate("/dashboard");
      })
      .catch(() => {
        localStorage.removeItem("doodle_token");
        navigate("/login?error=google_auth_failed");
      });
  }, []);

  return (
    <div className="loading-screen">
      <div className="spinner" />
      <span>Signing you in with Google...</span>
    </div>
  );
};

export default GoogleAuthSuccess;
