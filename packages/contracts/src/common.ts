import { z } from "zod";

export const API_PREFIX = "/api/v1";
export const idSchema = z.string().min(1);
export const moneyPaiseSchema = z.number().int().nonnegative();
export const businessDateSchema = z.iso.date();
export const timestampSchema = z.iso.datetime();
export const languageSchema = z.enum(["en", "te", "hi"]);
export const pageRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
  requestId: z.string(),
});
export const healthSchema = z.object({ status: z.literal("ok") });

export type ID = z.infer<typeof idSchema>;
export type MoneyPaise = z.infer<typeof moneyPaiseSchema>;
export type BusinessDate = z.infer<typeof businessDateSchema>;
export type Language = z.infer<typeof languageSchema>;
export type PageRequest = z.infer<typeof pageRequestSchema>;
export type PageResult<T> = PageRequest & { items: T[]; total: number };
export type ApiSuccess<T> = { data: T; meta: { requestId: string } };
export type ApiError = z.infer<typeof apiErrorSchema>;
export type Health = z.infer<typeof healthSchema>;
