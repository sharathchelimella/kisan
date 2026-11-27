import { z } from "zod";
import { idSchema, languageSchema } from "./common";

export const ownerSchema = z.object({
  id: idSchema,
  displayName: z.string().min(1),
  role: z.literal("OWNER"),
  preferredLanguage: languageSchema,
  email: z.email().optional(),
  mobile: z.string().optional(),
});
export const businessSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  village: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1),
  invoicePrefix: z.string().min(1),
});
export const sessionSchema = z.object({
  owner: ownerSchema,
  business: businessSchema,
});
export type Session = z.infer<typeof sessionSchema>;
