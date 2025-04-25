// src/lib/services/gallery.service.ts
import {
    createGallery,
    findGalleriesByUserId,
    findGalleryById,
    updateGallery,
    softDeleteGallery,
  } from "@/lib/db/repositories/gallery.repository";
  
  import {
    softDeletePostsByGallery,
  } from "@/lib/db/repositories/galleryPost.repository";
  
  import { connectDB } from "@/lib/db/connection";
  import Gallery from "@/lib/db/models/gallery.model";
  import mongoose from "mongoose";
  
  const DEFAULT_GALLERY_NAMES = ["General", "Commissions"] as const;
  
  export async function getUserGalleries(userId: string) {
    return findGalleriesByUserId(userId);
  }
  
  export async function createUserGallery(userId: string, name: string) {
    if (name.trim().length === 0 || name.length > 50)
      throw new Error("Invalid gallery name");
    return createGallery(userId, name.trim());
  }
  
  export async function renameGallery(
    userId: string,
    galleryId: string,
    name: string
  ) {
    const gallery = await findGalleryById(galleryId);
    if (!gallery || gallery.userId.toString() !== userId)
      throw new Error("Gallery not found");
  
    if (DEFAULT_GALLERY_NAMES.includes(gallery.name as any))
      throw new Error("Default galleries cannot be renamed");
  
    return updateGallery(galleryId, { name: name.trim() });
  }
  
  export async function deleteGallery(userId: string, galleryId: string) {
    const gallery = await findGalleryById(galleryId);
    if (!gallery || gallery.userId.toString() !== userId)
      throw new Error("Gallery not found");
  
    if (DEFAULT_GALLERY_NAMES.includes(gallery.name as any))
      throw new Error("Default galleries cannot be deleted");
  
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await softDeleteGallery(userId, galleryId);
      await softDeletePostsByGallery(galleryId, session);
    });
    session.endSession();
  }
  