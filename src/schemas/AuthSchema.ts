// src/schemas/LoginSchema.ts
import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(8).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
});

export type LoginType = z.infer<typeof LoginSchema>;
