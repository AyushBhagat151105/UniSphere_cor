<!-- Source: AGENTS.md -->

# UniSphere (`UniSphere_cor`) — AI & Engineering Context

This file provides authoritative architectural, domain, and workflow rules for AI assistants and developers working on **UniSphere** (Flagship multi-university platform by the **CHARUSAT Development Club**, starting with **CHARUSAT** and the **CMPICA** department).

---

## 1. Documentation & Blueprint Reference (`./docs`)

Always consult these specifications before modifying database schemas, routes, or UI screens:

- **[`README.md`](./README.md)** — Project overview, 3-logo institutional header (`assets/`), quickstart, and local MongoDB setup.
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — Beginner-friendly 4-layer Express workflow (`routes -> validators -> controllers -> services`), standardized JSON response envelope, and Git conventions for ~30 developers across 3 teams.
- **[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)** — End-to-end system architecture, 5-tier RBAC, `ClubCoAdminGuard`, 3-scope event visibility engine, multi-device `UserSession`, and `<150ms` HMAC-SHA256 QR Gate Scanner flows.
- **[`docs/DB_MODELS.md`](./docs/DB_MODELS.md)** — Complete field-by-field schema and index reference for all **12 MongoDB collections** (`packages/db`).
- **[`docs/API_SPEC.md`](./docs/API_SPEC.md)** — Exhaustive reference for all **63 REST API endpoints** under `/api/v1` across 10 modules (`apps/server`).
- **[`docs/ONBOARDING_AND_ROLES.md`](./docs/ONBOARDING_AND_ROLES.md)** — Closed-loop CSV onboarding (`students.csv` & `teachers.csv`), mandatory first-login password change (`mustChangePassword: true`), and the 5-tier permission matrix.

---

## 2. Core Domain Rules (Non-Negotiable)

1. **5-Tier Multi-University RBAC Hierarchy**:
   - **Tier 1 — `SUPER_ADMIN`**: Dev Club Platform Managers. Onboards universities (not limited to CHARUSAT), provisions multiple Main University Admins (`University.adminIds[]`), and monitors cross-university KPIs on the **Global Super Dashboard**.
   - **Tier 2 — `UNIVERSITY_ADMIN`**: Multiple allowed per university. Creates academic Departments (`CMPICA`, `CSPIT`, `DEPSTAR`) and assigns multiple Department Admins (`Department.adminIds[]`).
   - **Tier 3 — `DEPARTMENT_ADMIN`**: Multiple allowed per department. Bulk-onboards **Teachers** and **Students** (categorized by `branch` like `BCA`/`MCA`, `batchYear`, `semester`, and `classDivision`) via `.csv` imports.
   - **Tier 4 — `TEACHER` (Faculty)**: Creates events across 3 scopes (`CLASS`, `DEPARTMENT`, `UNIVERSITY`), creates Campus Clubs (*Garba Club*, *Drawing Club*), serves as Faculty Club Admin, scans QR codes at venue gates, and exports Recharts/Excel attendance reports.
   - **Tier 5 — `STUDENT` & `STUDENT_REP_ADMIN`**: Logs in with CSV-provisioned credentials, browses the Instagram-style poster feed, registers in 1 click using **autofilled profile data**, receives **QR tickets on both Mobile App Wallet + Email**, and can co-lead clubs alongside a Teacher (`ClubCoAdminGuard`).
2. **Closed-Loop CSV Onboarding (Zero Public Self-Registration)**:
   - Never create public student/teacher sign-up endpoints. Accounts are provisioned via Department Admin CSV import (`mustChangePassword: true`) and activated via `POST /api/v1/auth/activate-account`.
3. **Dual Club Co-Leadership (`ClubCoAdminGuard`)**:
   - Campus clubs store both `facultyAdminIds[]` (Teachers) and `studentRepAdminIds[]` (Student Co-Admins) who share permissions to approve club members, post posters, and organize club events.
4. **3-Scope Event Visibility Engine**:
   - Every event and feed post defines `scopeConfig.scopeLevel` (`CLASS`, `DEPARTMENT`, or `UNIVERSITY`) with optional `targetDepartmentIds`, `targetBranches`, `targetBatchYears`, and `targetClassDivisions`.
5. **Multi-Device `UserSession` Tracking**:
   - Users can stay logged in across Web and React Native Mobile simultaneously (`user_sessions` collection with per-device `sessionId`, `deviceMetadata`, `expoPushToken`, and SHA-256 `refreshTokenHash` rotation) and remotely revoke any device.
6. **3 Parallel Engineering Teams (~30 Beginner Developers)**:
   - **Team 1 (Core Platform — Lead Team)**: Foundation (`packages/db`, `packages/env`, `packages/config`), 5-tier RBAC, CSV import, Clubs, 3-Scope Events, Instagram Poster Feed, QR Tickets, Camera Gate Scanner, and Analytics/Exports.
   - **Team 2 (Alumni Addon)**: `alumni_mentorships` hooking into `User.studentProfile.isAlumni`.
   - **Team 3 (Placement Addon)**: `placement_drives` hooking into `User.studentProfile.cgpa`, `branch`, and `batchYear`.

---

## 3. Tech Stack & Architecture Pattern

- **Runtime & Package Manager**: `bun` + `turborepo`
- **Backend (`apps/server`)**: Express 5 + TypeScript + Zod + Socket.IO + BullMQ + Redis + Nodemailer + Cloudinary + Winston + OpenTelemetry.
  - Follow the **4-Layer Backend Pattern**: `*.routes.ts -> *.validators.ts -> *.controllers.ts -> *.services.ts`.
- **Web (`apps/web`)**: React 19 + TanStack Router + TanStack Query + Tailwind CSS + shadcn/ui + Zustand + Framer Motion + React Hook Form + Recharts + SheetJS (`xlsx`).
- **Mobile (`apps/native`)**: React Native (Expo Router) + Expo Camera (QR Scanner) + Expo Image + Expo Notifications.
- **Database (`packages/db`)**: MongoDB 8.0 (`mongo:8.0.4` with `GLIBC_TUNABLES: "glibc.pthread.rseq=0"` for Linux kernel 6.19+ compatibility) + Prisma ORM (`packages/db/prisma/schema.prisma`).
  - Local MongoDB Compass URI: `mongodb://root:password@localhost:27017/UniSphere_cor?authSource=admin`

---

## 4. Project Structure

```text
UniSphere_cor/
├── assets/                  # CHARUSAT, CMPICA, and Dev Club logos
├── docs/                    # ARCHITECTURE.md, DB_MODELS.md, API_SPEC.md, ONBOARDING_AND_ROLES.md
├── apps/
│   ├── web/                 # Frontend Web Portal (React 19 + TanStack Router + shadcn/ui)
│   ├── native/              # Mobile App (React Native + Expo Camera QR Scanner)
│   └── server/              # Backend REST API (/api/v1 — 63 endpoints across 10 routers)
├── packages/
│   ├── db/                  # MongoDB Docker Compose + 12-collection Prisma schema
│   ├── env/                 # Shared Zod environment validation
│   └── config/              # Shared TypeScript configuration
├── README.md
└── CONTRIBUTING.md
```

---

## 5. Common Commands

- `bun install` — Install dependencies across all workspaces
- `bun run --filter @UniSphere_cor/db db:start` — Start local MongoDB 8.0 container (`UniSphere_cor-mongodb`)
- `bun run db:generate` — Generate Prisma client
- `bun run db:push` — Push 12-collection schema to MongoDB
- `bun run db:studio` — Open Prisma Studio UI
- `bun run dev` — Start all apps (`web`, `server`, `native`) in development mode
- `bun run dev:web` — Start only `apps/web`
- `bun run dev:server` — Start only `apps/server`
- `bun run dev:native` — Start only `apps/native`
- `bun run check-types` — Type-check all workspaces
- `bun run build` — Build for production
- `bun run test` — Run Vitest test suites

---

## Better Fullstack project context

`bts.jsonc` is the authority for the current Stack Graph. Its `stackParts` array owns role selection and `ownerPartId` bindings. Top-level option fields are a compatibility projection and must not become a second mutation path.

### Stack Parts, ownership, and evidence

- `aiTooling:universal:ruler`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `aiTooling:universal:skills`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.backendUtilities:typescript:backend-utils`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.caching:typescript:redis`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.deploy:typescript:docker`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.email:typescript:nodemailer`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.fileStorage:typescript:cloudinary`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.jobQueue:typescript:bullmq`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.logging:typescript:winston`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.observability:typescript:opentelemetry`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.orm:typescript:prisma`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.realtime:typescript:socket-io`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.runtime:typescript:bun`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.testing:typescript:vitest`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend.validation:typescript:zod`. It belongs to `backend:typescript:express`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `backend:typescript:express`. Its generated target is `apps/server`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `containerOrchestration:universal:docker-compose`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `continuousIntegration:universal:github-actions`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `database.dbSetup:universal:docker`. It belongs to `database:universal:mongodb`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `database:universal:mongodb`. Its generated target is `packages/db`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `developerEnvironment:universal:devcontainer`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.animation:typescript:framer-motion`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.css:typescript:tailwind`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.dataFetching:typescript:tanstack-query`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.deploy:typescript:docker`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.forms:typescript:react-hook-form`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.httpClient:typescript:axios`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.stateManagement:typescript:zustand`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend.ui:typescript:shadcn-ui`. It belongs to `frontend:typescript:tanstack-router`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `frontend:typescript:tanstack-router`. Its generated target is `apps/web`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.deepLinking:react-native:expo-linking`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.libraries:react-native:expo-camera`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.libraries:react-native:expo-image-picker`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.libraries:react-native:expo-image`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.libraries:react-native:expo-sharing`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.navigation:react-native:expo-router`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.ota:react-native:expo-updates`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile.push:react-native:expo-notifications`. It belongs to `mobile:react-native:native-bare`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `mobile:react-native:native-bare`. Its generated target is `apps/native`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.
- `workspaceRunner:universal:turborepo`. Evidence is `listed` with `unverified` freshness. Verification maintainer: @Marve10s.

### Installed-version authority

Use `bts.jsonc` for the generator and schema version. Use local package manifests and lockfiles for installed dependency versions. Do not assume that documentation for a newer Better Fullstack release matches this project.

### Compatibility and lifecycle safety

Run `create-better-fullstack context --json` for bounded roles, capabilities, evidence, compatibility issues, and safe next actions. Run `create-better-fullstack doctor --json` before repairing graph drift. Existing-project writes must start with a plan and use the exact review token. Use `create-better-fullstack recipes check --json` before editing recipe-owned paths or managed regions, and use recipe history plus project recovery commands to undo a reviewed operation.

User code outside an explicit Better Fullstack managed region is not generator-owned. Missing or changed managed-region hashes stop recipe planning for manual review.

<!-- <better-fullstack:recipes sha256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855> -->

<!-- </better-fullstack:recipes> -->

## Maintenance

Keep `AGENTS.md` and `CLAUDE.md` updated when:

- Adding/removing dependencies
- Changing project structure or database models (`docs/DB_MODELS.md`)
- Adding new features or API endpoints (`docs/API_SPEC.md`)
- Modifying build/dev workflows
