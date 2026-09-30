import { Router } from "express";
import { registerRoute } from "../../../utils/routeBuilder";
import { createClubBodySchema, createClubResponseSchema } from "../validators/clubs.validators";

const router: Router = Router();

// Define and register the route for OpenAPI documentation and mounting on Express
registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/clubs",
    summary: "Create a new Campus Club",
    tags: ["Clubs"],
    security: "bearer", // As specified in the design pattern
    request: {
      body: createClubBodySchema,
    },
    responses: {
      "201": {
        description: "Campus club created successfully",
        schema: createClubResponseSchema,
      },
    },
  },
  // Usually requireAuth, requireRole would go here:
  // requireAuth,
  // requireRole(["TEACHER", "DEPARTMENT_ADMIN", "UNIVERSITY_ADMIN"]),
  async (req, res, next) => {
    try {
      // Typically: const data = await createClubService(req.body);
      const data = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: req.body.name,
        createdAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: "Campus club created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
