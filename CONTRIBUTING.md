# Contributing to UniSphere

Welcome to the **UniSphere** engineering repository, built by the **CHARUSAT Development Club**!

This guide is written specifically for our **~30 student developers and team leaders across Team 1 (Core Platform), Team 2 (Alumni Network), and Team 3 (Placement Cell)**. Follow every step in this guide to keep our monorepo clean, type-safe, and conflict-free.

---

## 1. Golden Rules for All Contributors

1. **Never Push Directly to `main` or `master`**: Always create a feature branch for your task and open a Pull Request (PR) for your Team Leader to review.
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

To make backend development easy to learn and consistent across all 30 developers, every module inside `apps/server/src/modules/<module-name>/` contains **4 files**:

```text
apps/server/src/modules/clubs/
├── clubs.routes.ts        # 1. Express Router + Auth/Role Middleware Guards
├── clubs.validators.ts    # 2. Zod Request Schemas (params, query, body)
├── clubs.controllers.ts   # 3. HTTP Request/Response handling (calls Service)
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

### Layer 4: `*.routes.ts` (Express Routes & RBAC Guards)
Attach authentication, role guards (`requireRole`, `requireClubCoAdmin`), and Zod validation middleware:
```typescript
router.post(
  "/",
  requireAuth,
  requireRole(["TEACHER", "DEPARTMENT_ADMIN", "UNIVERSITY_ADMIN"]),
  validateRequest({ body: createClubBodySchema }),
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
