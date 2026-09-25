# UniSphere — System Architecture & Engineering Blueprint

<div align="center">
  <img src="../assets/charusat-logo.png" alt="CHARUSAT University" width="360" />
</div>

---

## 1. Architectural Philosophy

UniSphere is designed around **two simultaneous goals**:
1. **Production-Grade Multi-University Scale**: Strict multi-tenant isolation (`universityId`, `departmentId`), closed-loop CSV identity provisioning, sub-150ms cryptographic QR gate scanning, real-time Socket.IO counters, and Instagram-style media feeds.
2. **Beginner-Friendly Engineering Clarity**: Because UniSphere is built by **~30 student developers across 3 teams** in the **CHARUSAT Development Club**, every package and service follows an explicit, predictable pattern (`routes -> validators -> controllers -> services`) with zero hidden magic.

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Clients["Client Applications"]
        WEB["apps/web<br/>React 19 + TanStack Router + shadcn/ui<br/>(Super Admin, Uni Admin, Dept Admin, Teacher & Student Web Portal)"]
        MOBILE["apps/native<br/>React Native (Expo Router + Expo Camera)<br/>(Student Poster Feed, Mobile QR Wallet & Camera Gate Scanner)"]
    end

    subgraph Server["apps/server — Express.js 5 Backend (/api/v1)"]
        MW["Security & Tenant Middleware<br/>AuthGuard • 5-Tier RoleGuard • ClubCoAdminGuard • EventScannerGuard"]
        VAL["Zod Request Validators<br/>(Body, Params, Query & CSV Row Validation)"]
        CTRL["REST Controllers & Socket.IO Gateways<br/>(63 Endpoints across 10 Routers)"]
        SVC["Domain Services<br/>(Auth, CSV Import, 3-Scope Events, HMAC QR Signer, Recharts Aggregator)"]
    end

    subgraph Infra["Data & Background Infrastructure"]
        MONGO[("MongoDB 8.0 (packages/db)<br/>12 Core & Addon Collections")]
        REDIS[("Redis + BullMQ<br/>Async CSV Onboarding Emails, QR Pass Emails & Push Jobs")]
        CDN[("Cloudinary CDN<br/>4:5, 1:1 & 16:9 Event Posters & Carousels")]
        SMTP["Nodemailer SMTP<br/>Welcome Credentials & HTML QR Tickets"]
    end

    WEB -->|HTTPS REST + WebSocket| MW
    MOBILE -->|HTTPS REST + WebSocket| MW
    MW --> VAL --> CTRL --> SVC
    SVC --> MONGO
    SVC --> REDIS
    SVC --> CDN
    REDIS --> SMTP
```

---

## 3. Monorepo Package Ownership Matrix

| Workspace Path | Package Name | Primary Owner | Responsibility |
| :--- | :--- | :--- | :--- |
| `apps/server` | `@UniSphere_cor/server` | Team 1 (Core) + Team 2/3 Routers | Express 5 REST API (`/api/v1/*`), Socket.IO live attendance server, BullMQ workers, Nodemailer, OpenTelemetry. |
| `apps/web` | `@UniSphere_cor/web` | Team 1, Team 2, Team 3 | Role-based Web Dashboards (Global Super Dashboard, University Admin, Dept CSV Importer, Teacher/Club Studio, Student Feed, Recharts + SheetJS Exports). |
| `apps/native` | `@UniSphere_cor/native` | Team 1 (Mobile Sub-team) | React Native (Expo) app featuring Instagram Poster Feed, 1-Click Autofill Registration, Offline-Ready QR Ticket Wallet, and Camera QR Gate Scanner. |
| `packages/db` | `@UniSphere_cor/db` | Team 1 Leads | Locked 12-collection Prisma/MongoDB schema (`packages/db/prisma/schema.prisma`) and database client singleton. |
| `packages/env` | `@UniSphere_cor/env` | Team 1 Leads | Zod-validated environment configuration (`server`, `web`, `native`). |
| `packages/config` | `@UniSphere_cor/config` | Team 1 Leads | Shared TypeScript compiler configurations across workspaces. |

---

## 4. Five-Tier Multi-University RBAC & Dual Club Co-Leadership

UniSphere enforces a 5-tier institutional role hierarchy plus delegated **Student Representative Club Co-Admin** authority:

### 4.1 Role Hierarchy
1. **`SUPER_ADMIN` (Tier 1 — Dev Club Managers)**:
   - Onboards new Universities (`CHARUSAT`, etc.) and assigns **multiple Main University Admins** (`University.adminIds[]`).
   - Views cross-university KPIs and tenant growth charts on the **Global Super Dashboard**.
2. **`UNIVERSITY_ADMIN` (Tier 2 — Multiple per University)**:
   - Manages university-wide settings, creates academic Departments (`CMPICA`, `CSPIT`, `DEPSTAR`), and assigns **multiple Department Admins** (`Department.adminIds[]`).
   - Publishes university-wide (`UNIVERSITY` scope) events and monitors university analytics.
3. **`DEPARTMENT_ADMIN` (Tier 3 — Multiple per Department, e.g., CMPICA)**:
   - Configures department academic branches (`BCA`, `MCA`, `B.Sc(IT)`, `M.Sc(IT)`) and batch years (`1..4`).
   - Executes **Closed-Loop CSV Bulk Onboarding** for **Teachers** and **Students** (`POST /api/v1/departments/:deptId/import/teachers-csv` and `students-csv`).
4. **`TEACHER` (Tier 4 — Faculty)**:
   - Creates events across all 3 scopes (`CLASS`, `DEPARTMENT`, `UNIVERSITY`).
   - Creates Campus Clubs (e.g., *Garba Club*, *Drawing Club*), serves as **Faculty Club Admin** (`Club.facultyAdminIds[]`), promotes students to **Student Representative Co-Admins**, scans QR tickets at event gates, and exports `.csv`/`.xlsx` attendance sheets.
5. **`STUDENT` & `STUDENT_REP_ADMIN` (Tier 5 — Students & Club Co-Leaders)**:
   - Logs in with CSV-provisioned credentials, activates account on first login, browses the Instagram-style campus poster feed, registers in 1 click using **autofilled profile fields**, and receives QR tickets on both **Mobile App Wallet + Email**.
   - When promoted to `Club.studentRepAdminIds[]` (`User.clubRoles.studentRepClubIds[]`), passes the **`ClubCoAdminGuard`** alongside the Teacher Admin to approve club members, upload posters, and manage club events.

### 4.2 `ClubCoAdminGuard` Resolution Logic
```mermaid
flowchart LR
    REQ["Incoming Club / Event Request<br/>(PATCH /clubs/:clubId or POST /events)"] --> CHECK_ROLE{"Is User TEACHER,<br/>DEPT_ADMIN, or UNI_ADMIN?"}
    CHECK_ROLE -->|Yes, in Club's facultyAdminIds or Admin| ALLOW["200 OK — Authorized"]
    CHECK_ROLE -->|User is STUDENT| CHECK_REP{"Is clubId in<br/>User.clubRoles.studentRepClubIds<br/>AND Club.studentRepAdminIds?"}
    CHECK_REP -->|Yes| ALLOW
    CHECK_REP -->|No| DENY["403 Forbidden"]
```

---

## 5. Closed-Loop CSV Onboarding & Mandatory Account Activation

Direct public self-registration is disabled for Teachers and Students so that every student's `enrollmentNo`, `branch`, `batchYear`, `semester`, and `classDivision` is 100% institutionally verified.

```mermaid
sequenceDiagram
    actor DeptAdmin as Department Admin (CMPICA)
    participant API as apps/server (/departments/:deptId/import)
    participant DB as MongoDB (users & csv_import_batches)
    participant Queue as BullMQ + Nodemailer
    actor Student as Student (Web / Mobile App)

    DeptAdmin->>API: Upload students.csv (Enrollment, Branch, Year, Div, Email, Phone)
    API->>API: Validate rows with StudentCsvRowSchema (Zod)
    API->>DB: Upsert User records (mustChangePassword: true) + Save CsvImportBatch
    API->>Queue: Enqueue welcome credential emails (temp password)
    Queue-->>Student: Email temporary login credentials
    Student->>API: POST /api/v1/auth/login (email, tempPassword, deviceMetadata)
    API-->>Student: 200 OK { mustChangePassword: true, accessToken, sessionId }
    Note over Student,API: Protected API routes block until password is changed
    Student->>API: POST /api/v1/auth/activate-account (newPassword)
    API->>DB: Set mustChangePassword = false & revoke other temp sessions
    API-->>Student: Account Activated -> Redirect to Scoped Campus Poster Feed
```

---

## 6. Three-Scope Event Visibility & Eligibility Engine

Every `Event` and `FeedPost` contains a `scopeConfig` sub-document that controls both **who sees the event in their feed** and **who is permitted to register**:

| `scopeConfig.scopeLevel` | Target Audience | Eligibility Rule Verified by Backend |
| :--- | :--- | :--- |
| **`CLASS`** | Specific class division(s) inside a department (e.g., `CMPICA -> BCA -> Year 2 -> BCA-Sem3-DivA`) | `user.universityId == event.universityId` AND `user.departmentId in targetDepartmentIds` AND `user.studentProfile.branch in targetBranches` AND `user.studentProfile.batchYear in targetBatchYears` AND `user.studentProfile.classDivision in targetClassDivisions` |
| **`DEPARTMENT`** | Entire department or specific branches/years within a department (e.g., all `CMPICA` students, or `CMPICA MCA Year 1 & 2`) | `user.universityId == event.universityId` AND `user.departmentId in targetDepartmentIds` (plus optional `targetBranches` / `targetBatchYears` filters if non-empty) |
| **`UNIVERSITY`** | All students and faculty across all departments in the university (e.g., Annual `CHARUSAT` Spoural / Tech Fest) | `user.universityId == event.universityId` |

---

## 7. Multi-Device `UserSession` Architecture

Students and Teachers regularly use **UniSphere Web** (on a college lab desktop or laptop) and **UniSphere Mobile** (on Android/iOS) at the same time. Instead of a single-token overwrite model:

- Every `POST /api/v1/auth/login` creates a dedicated document in `user_sessions` (`UserSession`) with a unique `sessionId`, `deviceMetadata` (`deviceId`, `deviceName`, `platform: 'WEB' | 'ANDROID' | 'IOS'`, `ipAddress`, `userAgent`, `expoPushToken`), and a SHA-256 `refreshTokenHash`.
- Access JWTs carry `{ sub: userId, sessionId, role, universityId, departmentId }`.
- Users can inspect all active devices via `GET /api/v1/auth/sessions` and remotely sign out a forgotten lab PC (`DELETE /api/v1/auth/sessions/:sessionId`) or sign out all other devices (`POST /api/v1/auth/logout-other-devices`) without interrupting their phone session.

---

## 8. 1-Click Autofill Registration, Dual QR Pass & `<150ms` Gate Scanning

```mermaid
sequenceDiagram
    actor Student as Student (Mobile / Web)
    participant API as apps/server
    participant DB as MongoDB (event_registrations)
    participant MailPush as BullMQ (Email + Expo Push)
    actor Scanner as Teacher / Club Co-Admin (Expo Camera)

    Student->>API: GET /api/v1/events/:eventId/registration-preview
    API-->>Student: Pre-filled CSV profile (Name, Enrollment, CMPICA, BCA, Year 2, Div A)
    Student->>API: POST /api/v1/events/:eventId/register (1-Click Confirm + customFieldAnswers)
    API->>API: Generate ticketCode + HMAC-SHA256(regId:eventId:studentId, QR_SECRET)
    API->>DB: Insert EventRegistration (participantSnapshot + qrPass)
    API->>MailPush: Dispatch HTML QR Pass Email + Mobile Push Notification
    API-->>Student: Return QR Pass immediately into Mobile App Ticket Wallet

    Note over Student,Scanner: At Venue Gate on Event Day
    Student->>Scanner: Present QR Code from Mobile Wallet or Email
    Scanner->>API: POST /api/v1/events/:eventId/scan-qr { qrPayload }
    API->>API: Verify HMAC-SHA256 signature in memory + Check isPresent
    API->>DB: Atomic update: attendance.isPresent = true, checkedInAt = now()
    API-->>Scanner: <150ms Green Verified Card (Student Photo, Name, 24BCA045, BCA-Sem3-DivA)
```
