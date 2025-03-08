// src/schemas/LoginSchema.ts
import { z } from "zod";

export const LoginSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(20, { message: "Password must be at most 20 characters" })
    .refine((val) => val.trim().length > 0, {
      message: "Password cannot be empty or just spaces",
    }),

  username: z
    .string()
    .max(20, { message: "Username must be at most 20 characters" })
    .refine((val) => /^[a-z0-9]+$/.test(val), {
      message: "Username must be all lowercase letters and numbers only",
    })
    .refine((val) => val.trim().length > 0, {
      message: "Username cannot be empty or just spaces",
    }),
});

export type LoginType = z.infer<typeof LoginSchema>;
