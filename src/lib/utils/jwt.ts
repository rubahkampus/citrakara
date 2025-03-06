// src/lib/utils/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;         // or process.env.ACCESS_TOKEN_SECRET
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

export function generateAccessToken(payload: { id: string; username: string }) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: { id: string; username: string }) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}
