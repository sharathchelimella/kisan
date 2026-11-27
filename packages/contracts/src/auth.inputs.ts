import { z } from "zod";
import { languageSchema } from "./common";

export const authEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email());
export const recoverySchema = z.object({ email: authEmailSchema }).strict();
export const loginSchema = recoverySchema.extend({
  password: z.string().min(1).max(128),
});
export const registerSchema = loginSchema.extend({
  password: z.string().min(12).max(128),
  displayName: z.string().trim().min(1).max(100),
  businessName: z.string().trim().min(1).max(120),
  village: z.string().trim().min(1).max(100),
  preferredLanguage: languageSchema,
  verificationCode: z
    .string()
    .max(100)
    .regex(/^\d{10}\.[a-f0-9]{64}$/),
});
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export const AUTH_REQUEST_HEADER = "X-Kisan-Request";
