# Contributing to UniSphere

Welcome to the **UniSphere** engineering repository, built by the **CHARUSAT Development Club**!

This guide is written specifically for our **~30 student developers and team leaders across Team 1 (Core Platform), Team 2 (Alumni Network), and Team 3 (Placement Cell)**. Follow every step in this guide to keep our monorepo clean, type-safe, and conflict-free.

---

## 1. Golden Rules for All Contributors

1. **Never Push Directly to `main`!** Always branch off of and merge into `dev-branch`. Create a feature branch for your task and open a Pull Request (PR) against `dev-branch` for your Team Leader to review.
2. **Respect Workspace Ownership Boundaries**:
   - **`packages/db`**, **`packages/env`**, and **`packages/config`** are foundational packages managed by **Team 1 Leads**. If Team 2 or Team 3 needs a new database field or schema change, coordinate with a Team 1 Lead rather than editing `schema.prisma` unannounced.
   - **Zero Public Registration**: Never add a public `/signup` or `/register-user` endpoint for Students or Teachers. All campus accounts are provisioned via Department Admin CSV import (`mustChangePassword: true`).
3. **Always Follow the 4-Layer Backend Pattern (`apps/server`)**:
   Every API feature in `apps/server` must follow:
   `Route -> Zod Validator -> Controller -> Service -> Database (`@UniSphere_cor/db`)`
   Never write raw database queries directly inside an Express route file!

---

## 2. Team Boundaries & Where to Write Code

| Team | Primary Folders in `apps/server/src/modules/` | Primary Folders in `apps/web/src/routes/` | Owned Database Collections |
| :--- | :--- | :--- | :--- |
| **Team 1 (Core Platform)** | `auth/`, `super-admin/`, `universities/`, `departments/`, `clubs/`, `events/`, `registrations/`, `attendance/`, `analytics/`, `feed/`, `media/` | `_auth/`, `super-admin/`, `university-admin/`, `dept-admin/`, `clubs/`, `events/`, `feed/`, `scanner/` | `universities`, `departments`, `users`, `user_sessions`, `csv_import_batches`, `clubs`, `club_memberships`, `events`, `event_registrations`, `feed_posts`, `post_interactions`, `notifications` |
| **Team 2 (Alumni Addon)** | `alumni/` | `alumni/` | `alumni_mentorships` (reads `User.studentProfile.isAlumni`) |
| **Team 3 (Placement Addon)** | `placements/` | `placements/` | `placement_drives` (reads `User.studentProfile.cgpa`, `branch`, `batchYear`) |

---

## 3. Step-by-Step Backend Feature Workflow (`apps/server`)

To make backend development easy to learn and consistent across all 30 developers, every module inside `apps/server/src/modules/<module-name>/` contains **4 folders**:

```text
apps/server/src/modules/clubs/
├── routes/
│   └── clubs.routes.ts        # 1. Express Router + Auth/Role Middleware Guards
├── validators/
│   └── clubs.validators.ts    # 2. Zod Request Schemas (params, query, body)
├── controllers/
│   └── clubs.controllers.ts   # 3. HTTP Request/Response handling (calls Service)
└── services/
    └── clubs.services.ts      # 4. Business logic & Prisma/MongoDB queries
```

### Layer 1: `*.validators.ts` (Zod Input Validation)
Define strict Zod schemas for `body`, `query`, and `params`:
```typescript
import { z } from "zod";

export const createClubBodySchema = z.object({
  name: z.string().min(3).max(80),
  category: z.enum(["CULTURAL", "ARTS", "TECHNICAL", "SPORTS", "LITERARY", "SOCIAL"]),
  description: z.string().min(10).max(2000),
  departmentId: z.string().nullable().optional(),
  facultyAdminIds: z.array(z.string()).min(1),
  studentRepAdminIds: z.array(z.string()).default([]),
});
```

### Layer 2: `*.services.ts` (Business Logic & Database Queries)
Write reusable functions that talk to `@UniSphere_cor/db` and throw typed `AppError` exceptions when rules are violated:
```typescript
import prisma from "@UniSphere_cor/db";

export async function createClubService(universityId: string, createdBy: string, input: CreateClubInput) {
  // Business logic & database interaction here
}
```

### Layer 3: `*.controllers.ts` (Express Request & Response)
Parse the request, call the service, and return our standardized JSON envelope:
```typescript
export async function createClubController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await createClubService(req.user.universityId, req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Campus club created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}
```

### Layer 4: `*.routes.ts` (Express Routes, OpenAPI Specs, & RBAC Guards)
Instead of standard `router.post()`, we use `registerRoute` to automatically mount the documentation logic directly to Scalar via our Zod schemas, while still handling authentication and validation parameters predictably:
```typescript
import { registerRoute } from "../../utils/routeBuilder";

registerRoute(
  router,
  {
    method: "post",
    path: "/api/v1/clubs", 
    summary: "Create a new Campus Club",
    tags: ["Clubs"],
    security: "bearer",
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
  requireAuth,
  requireRole(["TEACHER", "DEPARTMENT_ADMIN", "UNIVERSITY_ADMIN"]),
  createClubController
);
```

---

## 4. Standardized API JSON Envelope

Every API endpoint in `apps/server` **must** return this exact JSON shape so `apps/web` and `apps/native` can consume responses predictably:

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Human-readable summary of what succeeded",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 145,
    "nextCursor": null
  }
}
```

### Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "EVENT_SCOPE_FORBIDDEN",
    "message": "This event is restricted to CMPICA BCA Sem-3 Division A students.",
    "details": []
  }
}
```

---

## 5. Git Branching & Pull Request Conventions

### The `dev-branch` Workflow
- **`main` is protected.** Never push directly to `main`!
- All active development happens against the **`dev-branch`**.
- Branch off of `dev-branch` to create your feature branch, and open your Pull Request strictly against `dev-branch`.

### Branch Naming
Always name your branch with your team number and feature type:
- `team1/feat/csv-student-import`
- `team1/feat/qr-gate-scanner`
- `team1/fix/session-refresh-rotation`
- `team2/feat/alumni-mentorship-booking`
- `team3/feat/placement-drive-eligibility`

### Commit Message Format (Conventional Commits)
```text
feat(clubs): add ClubCoAdminGuard for dual teacher and student rep access
fix(auth): rotate SHA-256 refreshTokenHash on per-device session refresh
docs(api): document 63 /api/v1 endpoints in docs/API_SPEC.md
```

### Pre-PR Checklist
Before opening a Pull Request, run these commands from the repository root and confirm zero errors:
```bash
# 1. Type-check all packages and apps
bun run check-types

# 2. Run unit & integration tests
bun run test

# 3. Verify production build succeeds
bun run build
```

---

## 6. Developer Environment & Local Setup Rules

### 6.1 VS Code Recommended Setup
Open the project in VS Code and accept the prompt to install recommended workspace extensions (or install them via `.vscode/extensions.json`):
- **Prisma** (`Prisma.prisma`): Syntax highlighting and formatting for `.prisma` models.
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`): Auto-complete for Tailwind utility classes and `cn()` helpers.
- **Prettier** (`esbenp.prettier-vscode`): Standardized code formatting on save.
- **Pretty TypeScript Errors** (`yoavbls.pretty-ts-errors`): Human-readable TypeScript diagnostics for beginner devs.
- **Thunder Client / REST Client** (`rangav.vscode-thunder-client`): In-editor REST API testing.

### 6.2 Initial Environment Setup
Copy the example environment files for each app and package before starting development:
```bash
# Server environment (Express API)
cp apps/server/.env.example apps/server/.env

# Web environment (React portal)
cp apps/web/.env.example apps/web/.env

# Native mobile environment (Expo app)
cp apps/native/.env.example apps/native/.env
```

### 6.3 Local Database & Services Quickstart
```bash
# 1. Start local MongoDB 8.0 replica set
bun run db:start

# 2. Generate Prisma Client
bun run db:generate

# 3. Push schema to MongoDB
bun run db:push

# 4. Optional: Seed initial demo data
bun run db:seed
```

