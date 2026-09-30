import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend zod to support openapi chaining
extendZodWithOpenApi(z);

export const openApiRegistry = new OpenAPIRegistry();

// Add a standard Bearer Auth security scheme that can be reused
export const bearerAuth = openApiRegistry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  }
);

export function generateOpenApiDocument(): any {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "UniSphere Core API",
      description: "API for the UniSphere multi-university management platform",
    },
    servers: [{ url: "/api/v1" }],
  });
}
