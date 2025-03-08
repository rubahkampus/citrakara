// src/lib/utils/axiosClient.ts
import axios from "axios";
import { logoutThunk } from "@/redux/slices/AuthSlice";
import { store } from "@/redux/store";

// Track if logout has already been triggered
let hasLoggedOut = false;

// Create an Axios instance
export const axiosClient = axios.create({
  baseURL: "", // Can be set dynamically
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // Ensures cookies (tokens) are sent
});

// Response interceptor for auto-refreshing tokens
axiosClient.interceptors.response.use(
  (response) => response, // ✅ If response is OK, return it
  async (error) => {
    const originalRequest = error.config;

    // If access token expired (401) and request hasn't been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loops

      try {
        // ✅ Attempt to refresh token
        await axiosClient.post("/api/auth/refresh");

        // ✅ Retry the original request after refreshing the token
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // ❌ If refresh token expired, log out user (but only once)
        if (!hasLoggedOut) {
          hasLoggedOut = true;
          store.dispatch(logoutThunk());

          // ✅ Clear all pending Axios requests to stop further API calls
          axiosClient.defaults.headers.common = {};
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
