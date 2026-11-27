import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    HOST: z.string().min(1).default("127.0.0.1"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    AUTH_REGISTRATION_SECRET: z.string().min(32).optional(),
    MONGODB_URI: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .string()
        .regex(/^mongodb(?:\+srv)?:\/\/[^\s]+$/)
        .optional(),
    ),
  })
  .refine(
    (env) => env.NODE_ENV !== "production" || env.MONGODB_URI !== undefined,
    {
      path: ["MONGODB_URI"],
      message: "MongoDB URI is required in production",
    },
  )
  .refine(
    (env) =>
      env.NODE_ENV !== "production" ||
      env.AUTH_REGISTRATION_SECRET !== undefined,
    {
      path: ["AUTH_REGISTRATION_SECRET"],
      message: "Registration secret is required in production",
    },
  );

export function readEnv(input: NodeJS.ProcessEnv) {
  return envSchema.parse(input);
}
