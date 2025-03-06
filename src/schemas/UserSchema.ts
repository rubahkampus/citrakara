// src/schemas/UserSchema.ts
import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(20),
  username: z.string().min(8).max(20).regex(/^[a-zA-Z0-9_]+$/),
});

export type RegisterType = z.infer<typeof RegisterSchema>;
