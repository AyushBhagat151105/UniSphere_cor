# UniSphere Backend Guidelines

This document provides an in-depth reference for developing features in the **UniSphere** Core Platform backend (`apps/server`). Our architecture strictly follows a **4-Layer Pattern** utilizing Express, Zod, Prisma, and an automatic OpenAPI documentation registry powered by Scalar.

---

## 1. Directory Structure & Module Architecture

All API endpoints live under `apps/server/src/modules/`. Unlike traditional MVC applications, we organize code by **Domain Modules** (e.g., `auth/`, `clubs/`, `events/`). Each module contains exact, nested subfolders for the four isolated layers:

```text
apps/server/src/modules/<module-name>/
├── routes/
│   └── <module-name>.routes.ts       # 1. Routing & Documentation Definition
├── validators/
│   └── <module-name>.validators.ts   # 2. Strong Zod Types & Validation Schemas
├── controllers/
│   └── <module-name>.controllers.ts  # 3. HTTP Gateway & Express Handlers
└── services/
    └── <module-name>.services.ts     # 4. Pure Business Logic & Database (Prisma)
```

**Why this structure?**
- Decouples Express HTTP requests from database operations.
- Guarantees complete type safety end-to-end.
- Prevents massive, hard-to-read "fat controllers."

---

## 2. API Documentation & The `registerRoute` Wrapper

We **do not** write separate Swagger or OpenAPI JSON/YAML files.
Instead, we automatically generate interactive API documentation in the Scalar Portal by building routes directly out of our Zod schemas.

Instead of calling the default `router.post(...)` or `router.get(...)`, you **must** use the `registerRoute` higher-order function imported from `src/utils/routeBuilder.ts`.

### Example Route Definition (`routes/clubs.routes.ts`)

```typescript
import { Router } from "express";
import { registerRoute } from "../../../utils/routeBuilder";
import { createClubBodySchema, createClubResponseSchema } from "../validators/clubs.validators";
import { createClubController } from "../controllers/clubs.controllers";

const router: Router = Router();

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/clubs", 
    summary: "Create a new Campus Club",
    tags: ["Clubs"],
    security: "bearer",     // Enforces the lock icon on the docs
    request: {
      body: createClubBodySchema
    },
    responses: {
      "201": {
        description: "Campus club created successfully",
        schema: createClubResponseSchema 
      }
    }
  },
  // You can stack normal Express middleware here:
  // requireAuth,
  // requireRole(["TEACHER", "DEPARTMENT_ADMIN", "UNIVERSITY_ADMIN"]),
  createClubController
);

export default router;
```

**Magic under the hood:** 
By passing your Zod schemas into the `request` and `responses` blocks, `registerRoute` will:
1. Automatically bind a validator middleware to intercept and validate your incoming payloads.
2. Publish the exact route structure and expected payloads to our live API docs (`/api/docs`).

---

## 3. Zod Validators (`validators/*.validators.ts`)

Always extend standard Zod schemas with the `.openapi()` chain. This is crucial—these metadata tags are what populate the interactive examples on our Scalar Docs page.

```typescript
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z); // Always invoke this in your validator files!

export const createClubBodySchema = z.object({
  name: z.string().min(3).max(80).openapi({
    example: "Developers Club",
    description: "The official name of the club as registered with the department.",
  }),
  category: z.enum(["CULTURAL", "ARTS", "TECHNICAL"]).openapi({
    example: "TECHNICAL",
  }),
});
```

---

## 4. Controllers (`controllers/*.controllers.ts`)

Controllers should **never** talk to the database (`prisma`). Their only job is:
1. Extracting data from `req.body`, `req.user`, or `req.params`.
2. Calling a reusable Service function.
3. Sending back the standardized JSON Envelope.

```typescript
import { Request, Response, NextFunction } from "express";
import { createClubService } from "../services/clubs.services";

export async function createClubController(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body is already validated and typed correctly since registerRoute handled it
    const data = await createClubService(req.user.universityId, req.user.id, req.body);
    
    // Always wrap responses in the default success envelope
    res.status(201).json({
      success: true,
      message: "Campus club created successfully",
      data,
    });
  } catch (error) {
    // Passes the error to the global exception handler
    next(error);
  }
}
```

---

## 5. Services (`services/*.services.ts`)

The service layer contains **100% of the core business logic**. They operate completely independently of Express, meaning they can be invoked via CLI scripts, cron jobs, or BullMQ background tasks safely.

```typescript
import prisma from "@UniSphere_cor/db";

export async function createClubService(universityId: string, authorId: string, input: any) {
  // 1. Business validations
  const existingClub = await prisma.club.findFirst({
    where: { name: input.name, universityId }
  });
  
  if (existingClub) {
    throw new AppError(409, "A club with this name already exists in your university.");
  }

  // 2. Database mutation
  const newClub = await prisma.club.create({
    data: {
      name: input.name,
      category: input.category,
      universityId,
      createdBy: authorId
    }
  });

  return newClub;
}
```

---

## 6. Global Standards & Pointers

1. **Error Handling**: Use the Global Error Middleware by passing errors down the chain via `next(error)`. The router builder will automatically catch `z.ZodError` exceptions and format them into readable `400 Bad Request` messages.
2. **Environment Variables**: Never use `process.env`. All environment logic lives in the `@UniSphere_cor/env` shared workspace and is strictly validated with Zod on boot.
3. **Database Client**: Import `@UniSphere_cor/db` to access the Prisma singleton without recreating connection pools unnecessarilly.
