import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";
import type { ZodTypeAny } from "zod";
import { openApiRegistry, bearerAuth } from "./openapi";
import { ApiError } from "./api-response";

export interface RouteConfig {
  method: "get" | "post" | "put" | "delete" | "patch";
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  security?: "bearer" | "none";
  request?: {
    body?: z.ZodTypeAny;
    query?: z.ZodObject<any>;
    params?: z.ZodObject<any>;
  };
  responses: {
    [statusCode: string]: {
      description: string;
      schema?: ZodTypeAny;
    };
  };
}

export function createApiResponseSchema(dataSchema?: ZodTypeAny) {
  if (dataSchema) {
    return z.object({
      success: z.literal(true),
      status: z.number(),
      message: z.string().optional(),
      data: dataSchema,
    });
  }
  return z.object({
    success: z.literal(true),
    status: z.number(),
    message: z.string().optional(),
  });
}

export const errorResponseSchema = z.object({
  success: z.literal(false),
  status: z.number(),
  error: z.string(),
  details: z.any().optional(),
});

/**
 * Validates request data against the provided Zod schemas and returns an exact standard error layout on failure.
 */
export function validateRequest(schemas: RouteConfig["request"]): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas?.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas?.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas?.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        next(new ApiError(400, "Validation Error", err.issues));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Registers an OpenAPI path based on Zod validators and connects them securely to an Express router.
 */
export function registerRoute(
  router: Router,
  config: RouteConfig,
  ...handlers: RequestHandler[]
) {
  // 1. Build OpenAPI path config
  const openApiPath: any = {
    method: config.method,
    path: config.path,
    summary: config.summary,
    description: config.description,
    tags: config.tags,
    responses: {},
  };

  if (config.security === "bearer") {
    openApiPath.security = [{ [bearerAuth.name]: [] }];
  }

  // Request definitions
  if (config.request) {
    openApiPath.request = {};
    if (config.request.body) {
      openApiPath.request.body = {
        content: {
          "application/json": {
            schema: config.request.body,
          },
        },
      };
    }
    if (config.request.query) {
      openApiPath.request.query = config.request.query;
    }
    if (config.request.params) {
      openApiPath.request.params = config.request.params;
    }
  }

  // Success responses
  for (const [statusCode, resConfig] of Object.entries(config.responses)) {
    if (resConfig.schema) {
      openApiPath.responses[statusCode] = {
        description: resConfig.description,
        content: {
          "application/json": {
            schema: createApiResponseSchema(resConfig.schema),
          },
        },
      };
    } else {
      openApiPath.responses[statusCode] = {
        description: resConfig.description,
        content: {
          "application/json": {
            schema: createApiResponseSchema(),
          },
        },
      };
    }
  }

  // Standard Error responses
  if (config.request) {
    openApiPath.responses["400"] = {
      description: "Bad Request / Validation Error",
      content: { "application/json": { schema: errorResponseSchema } },
    };
  }
  openApiPath.responses["401"] = {
    description: "Unauthorized",
    content: { "application/json": { schema: errorResponseSchema } },
  };
  openApiPath.responses["403"] = {
    description: "Forbidden",
    content: { "application/json": { schema: errorResponseSchema } },
  };
  openApiPath.responses["500"] = {
    description: "Internal Server Error",
    content: { "application/json": { schema: errorResponseSchema } },
  };

  // Append mapping into Zod-to-OpenApi registry
  openApiRegistry.registerPath(openApiPath);

  // 2. Mount on the actual Express router
  // Convert OpenAPI path params format `/users/{id}` to Express format `/users/:id`
  const expressPath = config.path.replace(/\{([^}]+)\}/g, ":$1");

  if (config.request) {
    router[config.method](
      expressPath,
      validateRequest(config.request),
      ...handlers
    );
  } else {
    router[config.method](expressPath, ...handlers);
  }
}
