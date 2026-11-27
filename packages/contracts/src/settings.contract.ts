import { z } from "zod";
import { languageSchema } from "./common";

const contactSchema = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d\s()-]*$/);
export const textSizeSchema = z.enum(["STANDARD", "LARGE"]);
export const settingsSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  village: z.string().trim().min(1).max(120),
  phone: contactSchema.optional(),
  address: z.string().trim().max(500).optional(),
  timezone: z.string().min(1),
  invoicePrefix: z.string().min(1),
  nextInvoiceSequence: z.number().int().positive(),
  ownerDisplayName: z.string().trim().min(1).max(120),
  ownerMobile: contactSchema.optional(),
  preferredLanguage: languageSchema,
  notificationsOptIn: z.boolean(),
  textSize: textSizeSchema,
});
export const settingsUpdateSchema = settingsSchema
  .pick({
    businessName: true,
    village: true,
    phone: true,
    address: true,
    ownerDisplayName: true,
    ownerMobile: true,
    preferredLanguage: true,
    notificationsOptIn: true,
    textSize: true,
  })
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);
export type Settings = z.infer<typeof settingsSchema>;
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
