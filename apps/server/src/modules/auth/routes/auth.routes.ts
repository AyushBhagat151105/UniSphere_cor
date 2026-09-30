import { Router } from "express";
import { registerRoute } from "../../../utils/routeBuilder";
import { loginBodySchema, authResponseSchema, activateAccountBodySchema, refreshTokenBodySchema, meResponseSchema } from "../validators/auth.validators";
import { loginController, activateAccountController, logoutController, refreshController, meController } from "../controllers/auth.controllers";
import { z } from "zod";

const router: Router = Router();

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/auth/login",
    summary: "Authenticate a user",
    tags: ["Auth"],
    security: "none",
    request: {
      body: loginBodySchema,
    },
    responses: {
      "200": {
        description: "Standard JWT and User payload",
        schema: authResponseSchema,
      },
    },
  },
  loginController
);

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/auth/activate-account",
    summary: "Activate an onboarded user acccount",
    tags: ["Auth"],
    security: "none",
    request: {
      body: activateAccountBodySchema,
    },
    responses: {
      "200": {
        description: "Account activated",
        schema: z.object({ id: z.string(), email: z.string(), status: z.string() })
      },
    },
  },
  activateAccountController
);

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/auth/logout",
    summary: "Revoke an active refresh token",
    tags: ["Auth"],
    security: "bearer",
    request: {
      body: refreshTokenBodySchema,
    },
    responses: {
      "200": {
        description: "Successfully revoked session",
      },
    },
  },
  logoutController
);

export default router;

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/auth/refresh",
    summary: "Refresh access token",
    tags: ["Auth"],
    security: "none",
    request: {
      body: refreshTokenBodySchema,
    },
    responses: {
      "200": {
        description: "New JWT tokens correctly generated via active session",
        schema: z.object({ accessToken: z.string(), refreshToken: z.string() })
      },
    },
  },
  refreshController
);

import { requireAuth } from "../../../middlewares/auth.middleware";

registerRoute(
  router,
  {
    method: "get",
    path: "/api/v1/auth/me",
    summary: "Get current user profile",
    tags: ["Auth"],
    security: "bearer",
    responses: {
      "200": {
        description: "Authenticated user payload",
        schema: meResponseSchema
      }
    }
  },
  requireAuth,
  meController
);
