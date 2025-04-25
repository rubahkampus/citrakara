// src/lib/utils/cloudflare.ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { v4 as uuid } from "uuid";

// Cloudflare R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

/** Upload file to Cloudflare R2 */
export async function uploadFileToR2(file: Blob, path: string) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);
  
    const params = {
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: path,
      Body: stream,
      ContentType: file.type,
      ContentLength: buffer.length, // ✅ Ensure Content-Length is set
    };
  
    await r2Client.send(new PutObjectCommand(params));
  
    // ✅ Use the public R2.dev URL
    return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${path}`;
  }

/**
 * Upload multiple image blobs and return their public URLs in the same order.
 * Keeps the folder structure: `gallery/<user>/<gallery>/<uuid>.ext`
 */
export async function uploadGalleryImagesToR2(
  blobs: Blob[],
  userId: string,
  galleryId: string
): Promise<string[]> {
  return Promise.all(
    blobs.map(async (blob) => {
      const ext = blob.type.split("/")[1] || "dat";
      const key = `gallery/${userId}/${galleryId}/${uuid()}.${ext}`;
      return uploadFileToR2(blob, key);          // <- your existing uploader
    })
  );
}
