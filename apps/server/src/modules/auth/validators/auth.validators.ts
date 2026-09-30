import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const loginBodySchema = z.object({
  email: z.string().email().openapi({
    example: "student@depstar.charusat.ac.in",
    description: "The official university email address provided during onboarding.",
  }),
  password: z.string().min(8).openapi({
    example: "secret123",
  }),
});

export const activateAccountBodySchema = z.object({
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().openapi({
    description: "The refresh token retrieved via Expo SecureStore or HttpOnly Cookie.",
  }),
});

export const authResponseSchema = z.object({
  accessToken: z.string().openapi({ description: "JWT Access Token (15m expiry)" }),
  refreshToken: z.string().openapi({ description: "Opaque Refresh Token (7d expiry)" }),
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.string(),
    mustChangePassword: z.boolean(),
  }),
});

export const meResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.string(),
  status: z.string(),
  mustChangePassword: z.boolean(),
});
