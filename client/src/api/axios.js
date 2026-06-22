import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4444";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT token from localStorage if present
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("doodle_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage and redirect to login
      localStorage.removeItem("doodle_token");
      localStorage.removeItem("doodle_user");
      if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
