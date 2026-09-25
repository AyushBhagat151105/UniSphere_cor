<div align="center">
  <img src="./assets/charusat-logo.png" alt="CHARUSAT University Banner" width="420" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <img src="./assets/cmpica-logo.png" alt="CMPICA Department Crest" width="96" height="96" />
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <img src="./assets/clube-logo.jpeg" alt="CHARUSAT Development Club Logo" width="96" height="96" />
  

  <h1>UniSphere</h1>
  <p><strong>Centralized Multi-University Campus Events, Clubs, Visual Poster Feed, Autofill QR Ticketing & Analytics Platform</strong></p>
  <p>
    <em>Flagship Engineering Initiative by the <strong>CHARUSAT Development Club</strong> • Starting with <strong>CHARUSAT</strong> & <strong>CMPICA</strong></em>
  </p>

  <p>
    <a href="./docs/ARCHITECTURE.md"><strong>System Architecture</strong></a> •
    <a href="./docs/DB_MODELS.md"><strong>Database Models (12 Collections)</strong></a> •
    <a href="./docs/API_SPEC.md"><strong>REST API Reference (63 Endpoints)</strong></a> •
    <a href="./docs/ONBOARDING_AND_ROLES.md"><strong>5-Tier RBAC & CSV Onboarding</strong></a> •
    <a href="./CONTRIBUTING.md"><strong>Beginner Contributor Guide</strong></a>
  </p>
</div>

---

## 1. Overview & Vision

**UniSphere** is a production-grade, multi-university campus management and student engagement ecosystem engineered by the **CHARUSAT Development Club**. Built to scale across multiple universities while debuting at **Charotar University of Science and Technology (CHARUSAT)** and the **Smt. Chandaben Mohanbhai Patel Institute of Computer Applications (CMPICA)**, UniSphere replaces fragmented WhatsApp groups, Google Forms, and manual attendance sheets with one unified Web + Mobile platform:

- **Closed-Loop CSV Institutional Onboarding**: Zero public self-registration. Department Admins bulk-import verified **Teachers** and **Students** (with Branch, Batch Year, Semester, and Class Division) via `.csv` files with mandatory first-login password activation.
- **5-Tier Multi-University RBAC Hierarchy**: Strict tenant and academic isolation across `SUPER_ADMIN`, `UNIVERSITY_ADMIN`, `DEPARTMENT_ADMIN`, `TEACHER`, and `STUDENT` (`+ STUDENT_REP_ADMIN`).
- **Dual Club Co-Leadership (Teacher + Student Representative)**: Campus clubs (e.g., *Garba Club*, *Drawing Club*, *Development Club*) are jointly governed by **Faculty Teacher Admins** and **Student Representative Co-Admins** (`ClubCoAdminGuard`).
- **3-Scope Event Visibility Engine**: Organizers publish events scoped to a specific **Class Division** (`CLASS`, e.g., `BCA-Sem3-DivA`), an entire **Department** (`DEPARTMENT`, e.g., `CMPICA`), or the whole **University** (`UNIVERSITY`, e.g., `CHARUSAT`).
- **Instagram-Style Visual Campus Poster Feed**: Scrollable `4:5` / `1:1` / `16:9` poster carousels on Web and React Native Mobile with likes, comments, bookmarks, and a **1-Tap Autofill "Register Now"** CTA bar.
- **1-Click Autofill Registration & Dual QR Pass Delivery**: Student profile fields from the Department CSV import (`name`, `enrollmentNo`, `branch`, `batchYear`, `classDivision`, `email`, `phone`) auto-populate event registration forms and immediately generate an **HMAC-SHA256 signed QR ticket** delivered to both the **Mobile App Wallet** and **Email**.
- **`<150ms` Camera QR Gate Scanner & Recharts/Excel Analytics**: Faculty and authorized club scanners verify QR passes via camera at the venue gate, feeding live turnout dashboards (`Recharts`) and 1-click `.csv` / `.xlsx` (`SheetJS`) attendance exports.

---

## 2. Three-Team Engineering Structure (~30 Developers)

UniSphere is architected as a modular **Bun + Turborepo** monorepo so three parallel student engineering teams (8–12 developers + 2 team leaders per team) can build simultaneously without merge conflicts:

| Team | Scope & Mission | Owned Collections & Modules |
| :--- | :--- | :--- |
| **Team 1 — Core Platform & Event Engine** *(Foundation & Lead Team)* | Monorepo foundation (`packages/db`, `packages/env`, `packages/config`), 5-tier RBAC, multi-device `UserSession` auth, CSV bulk onboarding, Campus Clubs, 3-Scope Events, Instagram Poster Feed, QR Ticketing, Camera Gate Scanner, and Analytics/Exports. | `universities`, `departments`, `users`, `user_sessions`, `csv_import_batches`, `clubs`, `club_memberships`, `events`, `event_registrations`, `feed_posts`, `post_interactions`, `notifications` |
| **Team 2 — Alumni Network & Mentorship** *(Addon Module)* | Connects graduated students (`User.studentProfile.isAlumni === true`) with current campus batches for mentorship sessions, alumni talks, and career guidance events. | `alumni_mentorships` (hooks into `User.studentProfile.isAlumni`, `graduationYear`, `currentCompany`, and `events`) |
| **Team 3 — Placement Cell & Career Portal** *(Addon Module)* | Campus recruitment drives filtered automatically by verified student academic profiles (`branch`, `batchYear`, `cgpa`, `skills`, `resumeUrl`). | `placement_drives` (hooks into `User.studentProfile.cgpa`, `branch`, `batchYear`, and `departmentId`) |

---

## 3. Five-Tier Role Hierarchy

```mermaid
flowchart TD
    T1["Tier 1: SUPER_ADMIN<br/>(Dev Club Platform Managers)<br/>Onboards Universities • Assigns University Admins • Global Super Dashboard"]
    T2["Tier 2: UNIVERSITY_ADMIN<br/>(Multiple Main University Admins — e.g., CHARUSAT)<br/>Creates Academic Departments (CMPICA, CSPIT) • Assigns Dept Admins"]
    T3["Tier 3: DEPARTMENT_ADMIN<br/>(Multiple Dept Admins — e.g., CMPICA)<br/>Bulk-Onboards Teachers & Students via CSV (Branch, Year, Class Division)"]
    T4["Tier 4: TEACHER / FACULTY<br/>Creates 3-Scope Events (Class / Dept / University) • Creates Campus Clubs<br/>Faculty Club Admin • Camera QR Gate Scanner • Exports Attendance"]
    T5["Tier 5: STUDENT & STUDENT_REP_ADMIN<br/>Instagram Poster Feed • 1-Click Autofill Registration • Mobile + Email QR Wallet<br/>Co-Leads Clubs alongside Teacher as Student Representative Co-Admin"]

    T1 --> T2
    T2 --> T3
    T3 --> T4
    T3 --> T5
    T4 -. "Promotes Student to Club Co-Admin (ClubCoAdminGuard)" .-> T5
```

---

## 4. Tech Stack

| Layer | Technologies | Workspace Target |
| :--- | :--- | :--- |
| **Monorepo & Runtime** | [Bun](https://bun.sh) + [Turborepo](https://turbo.build) + TypeScript 5 | Root (`/`) |
| **Backend API (`apps/server`)** | **Express.js 5** (`routes -> validators -> controllers -> services`), **Zod** validation, **JWT + Multi-Device `UserSession`**, **Socket.IO** (live gate counters), **BullMQ + Redis** (CSV & email jobs), **Nodemailer**, **Cloudinary**, **Winston**, **OpenTelemetry** | `apps/server` |
| **Web Portal (`apps/web`)** | **React 19**, **TanStack Router**, **TanStack Query**, **Tailwind CSS 4**, **shadcn/ui**, **Zustand**, **Framer Motion**, **React Hook Form**, **Recharts**, **SheetJS (`xlsx`)** | `apps/web` |
| **Mobile App (`apps/native`)** | **React Native + Expo Router**, **Expo Camera** (QR Gate Scanner), **Expo Image**, **Expo Notifications** (Push QR Tickets & Club Approvals), **Expo Updates** | `apps/native` |
| **Database (`packages/db`)** | **MongoDB 8.0** + **Prisma ORM** (`packages/db/prisma/schema.prisma`) | `packages/db` |
| **Shared Config & Env** | `@UniSphere_cor/env` (T3 Env + Zod), `@UniSphere_cor/config` (Shared TS configs) | `packages/env`, `packages/config` |

---

## 5. Monorepo Workspace Structure

```text
UniSphere_cor/
├── assets/                          # Institutional logos (CHARUSAT, CMPICA, Dev Club)
│   ├── charusat-logo.png            # CHARUSAT University banner logo
│   ├── cmpica-logo.png              # CMPICA Department crest logo
│   └── clube-logo.jpeg              # CHARUSAT Development Club logo
├── docs/                            # Engineering & Architecture Documentation
│   ├── ARCHITECTURE.md              # System architecture, RBAC, flows & diagrams
│   ├── DB_MODELS.md                 # Complete 12-collection schema & index reference
│   ├── API_SPEC.md                  # Complete 63-endpoint REST API specification
│   └── ONBOARDING_AND_ROLES.md      # Closed-loop CSV onboarding & 5-tier guard rules
├── apps/
│   ├── server/                      # Express.js REST API (/api/v1) + Socket.IO + BullMQ
│   ├── web/                         # React 19 + TanStack Router + shadcn/ui Web Portal
│   └── native/                      # React Native (Expo) Student Wallet & QR Gate Scanner
├── packages/
│   ├── db/                          # MongoDB Docker Compose + Prisma Schema & Client
│   ├── env/                         # Type-safe environment variable schemas (Zod)
│   └── config/                      # Shared TypeScript configurations
├── CONTRIBUTING.md                  # Beginner-friendly workflow & coding standards
├── CLAUDE.md                        # AI assistant project context
├── docker-compose.yml               # Full-stack container orchestration
└── turbo.json                       # Turborepo pipeline configuration
```

---

## 6. Quickstart & Local Development

### Prerequisites
- **Bun** (`v1.2+`) — `curl -fsSL https://bun.sh/install | bash`
- **Docker & Docker Compose** (for MongoDB & Redis)
- **Node.js** (`v20+` LTS recommended for React Native / Expo tooling)

### Step 1: Install Dependencies
```bash
bun install
```

### Step 2: Start MongoDB Container
Start the local MongoDB 8.0 container (`UniSphere_cor-mongodb` on port `27017`):
```bash
bun run --filter @UniSphere_cor/db db:start
```

> **Linux Kernel 6.19+ / Fedora 44 Compatibility Note (`SERVER-121912`):**
> Both `packages/db/docker-compose.yml` and `docker-compose.yml` pin `image: mongo:8.0.4` with `GLIBC_TUNABLES: "glibc.pthread.rseq=0"` so MongoDB boots cleanly on Linux kernels `>= 6.19` (such as `7.2.x`).

### Step 3: Connect with MongoDB Compass (Optional)
Open **MongoDB Compass** and connect using:
```text
mongodb://root:password@localhost:27017/UniSphere_cor?authSource=admin
```

### Step 4: Push Database Schema & Generate Client
```bash
bun run db:generate
bun run db:push
```

### Step 5: Start the Development Servers
```bash
# Start all workspaces (Web + Server + Native)
bun run dev

# Or run individual workspaces:
bun run dev:server   # Express API server on http://localhost:3000
bun run dev:web      # React Web App on http://localhost:5173
bun run dev:native   # Expo React Native Metro bundler
```

---

## 7. Documentation Index

All architectural decisions, database schemas, and API contracts are documented inside [`./docs`](./docs):

1. [**System Architecture (`docs/ARCHITECTURE.md`)**](./docs/ARCHITECTURE.md) — Monorepo layers, Express request pipeline (`routes -> validators -> controllers -> services`), 3-Scope Event Visibility Engine, Multi-Device `UserSession` architecture, and HMAC-SHA256 QR Ticketing flow.
2. [**Database Models (`docs/DB_MODELS.md`)**](./docs/DB_MODELS.md) — Complete field-by-field specification for all **12 MongoDB collections**, embedded sub-documents, compound indexes, TTL indexes, and ER diagram.
3. [**REST API Specification (`docs/API_SPEC.md`)**](./docs/API_SPEC.md) — Exhaustive reference for all **63 `/api/v1` endpoints** across 10 routers, including HTTP methods, paths, RBAC middleware guards, request payloads, and JSON responses.
4. [**CSV Onboarding & 5-Tier RBAC (`docs/ONBOARDING_AND_ROLES.md`)**](./docs/ONBOARDING_AND_ROLES.md) — Step-by-step CSV import formats for Teachers and Students, first-login mandatory activation flow, and `ClubCoAdminGuard` dual governance rules.
5. [**Contributor Guide (`CONTRIBUTING.md`)**](./CONTRIBUTING.md) — Step-by-step handbook for Team 1, Team 2, and Team 3 developers.
