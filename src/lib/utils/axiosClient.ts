// src/lib/utils/axiosClient.ts
import axios from "axios";

// Create a minimal Axios instance
export const axiosClient = axios.create({
  baseURL: "", // Set if needed for SSR or environments
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // So cookies (tokens) are sent automatically
});
