// src/schemas/UserSchema.ts
import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),

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

  // Optional fields for user profile
  bio: z.string().max(200, { message: "Bio must be at most 200 characters" }).optional(),
  profilePicture: z.string().url({ message: "Invalid profile picture URL" }).optional(),
  banner: z.string().url({ message: "Invalid banner URL" }).optional(),
});

export type RegisterType = z.infer<typeof RegisterSchema>;
