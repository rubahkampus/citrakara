// lib/services/user.service.ts
import { findUserByEmail, findUserByUsername, findUserPublicProfileByUsername, updateUserByUsername } from "@/lib/db/repositories/user.repository";
import { uploadFileToR2 } from "@/lib/utils/cloudflare";

export async function checkUserAvailability(email?: string, username?: string) {
  if (!email && !username) throw new Error("Missing email or username");

  if (email) {
    const existing = await findUserByEmail(email);
    if (existing) return { error: "Email already in use" };
  }

  if (username) {
    const existing = await findUserByUsername(username);
    if (existing) return { error: "Username already taken" };
  }

  return { message: "Available" };
}

export async function getUserPublicProfile(username: string) {
  return findUserPublicProfileByUsername(username);
}

export async function updateUserProfile(username: string, formData: FormData) {
  const updates: Record<string, any> = {};

  const bio = formData.get("bio");
  if (bio && typeof bio === "string") updates.bio = bio;

  const profilePicture = formData.get("profilePicture");
  if (profilePicture instanceof Blob) {
    const profilePictureUrl = await uploadFileToR2(profilePicture, `profile-pics/${username}`);
    updates.profilePicture = profilePictureUrl;
  }

  const banner = formData.get("banner");
  if (banner instanceof Blob) {
    const bannerUrl = await uploadFileToR2(banner, `banners/${username}`);
    updates.banner = bannerUrl;
  }

  return updateUserByUsername(username, updates);
}
