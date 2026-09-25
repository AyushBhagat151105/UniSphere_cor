# UniSphere — Complete REST API Reference Specification (`apps/server` — 63 Endpoints)

<div align="center">
  <img src="../assets/charusat-logo.png" alt="CHARUSAT University" width="360" />
</div>

---

## 1. Base URL, Versioning & Middleware Guards

- **Base URL**: `/api/v1`
- **Interactive OpenAPI Docs**: `/api/docs` (Scalar UI)
- **Authentication Header**: `Authorization: Bearer <accessToken>`

### Standard Middleware Guards Used Across Routers
| Guard Name | Enforcement Rule |
| :--- | :--- |
| **`Public`** | Open route (login, token refresh, forgot/reset password). |
| **`AuthGuard`** | Verifies JWT signature, confirms `UserSession` (`sessionId`) is not revoked/expired, and blocks non-activation routes if `mustChangePassword === true`. |
| **`SUPER_ADMIN`** | Restricts endpoint strictly to Tier 1 Platform Super Admins (`user.role === 'SUPER_ADMIN'`). |
| **`UNIVERSITY_ADMIN`** | Restricts endpoint to Tier 2 Main University Admins of `:universityId` (or `SUPER_ADMIN`). |
| **`DEPARTMENT_ADMIN`** | Restricts endpoint to Tier 3 Department Admins of `:deptId` (or `UNIVERSITY_ADMIN` / `SUPER_ADMIN`). |
| **`ClubCoAdminGuard`** | Allows access to **both** the Club's Faculty Teacher Admin (`facultyAdminIds`) **and** the promoted Student Representative Co-Admin (`studentRepAdminIds`), plus Dept/Uni Admins. |
| **`EventOrganizerGuard`** | Allows access to the Event Creator, owning Club Co-Admins (`Teacher` + `Student Rep`), or Dept/Uni Admins. |
| **`EventScannerGuard`** | Allows access to `EventOrganizerGuard` + any user listed in `event.authorizedScannerIds[]`. |

---

## 2. Module 1: Authentication & Multi-Device Session Management (`/api/v1/auth`) — 9 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `POST` | `/api/v1/auth/login` | `Public` | `{ email, password, deviceId, deviceName, platform: 'WEB'\|'ANDROID'\|'IOS', expoPushToken? }` | Creates isolated `UserSession` record; returns `{ accessToken, refreshToken, sessionId, mustChangePassword, user }` |
| **2** | `POST` | `/api/v1/auth/activate-account` | `AuthGuard` | `{ currentPassword, newPassword, confirmPassword }` | Completes mandatory first-login activation for CSV-imported Teachers/Students; sets `mustChangePassword = false` |
| **3** | `POST` | `/api/v1/auth/refresh` | `Public` | `{ refreshToken, sessionId, deviceId }` | Rotates `accessToken` + SHA-256 `refreshTokenHash` for that specific device's `sessionId` |
| **4** | `GET` | `/api/v1/auth/sessions` | `AuthGuard` | Query: none | Lists all active logged-in devices (`WEB`, `ANDROID`, `IOS`) with `ipAddress`, `lastActiveAt`, and `isCurrentDevice` |
| **5** | `DELETE` | `/api/v1/auth/sessions/:sessionId` | `AuthGuard` | Param: `sessionId` | Remotely revokes and signs out a specific device session (e.g., signing out a lab desktop from Mobile App) |
| **6** | `POST` | `/api/v1/auth/logout-other-devices` | `AuthGuard` | `{}` | Revokes all active sessions across Web and Mobile *except* the currently authenticated `sessionId` |
| **7** | `POST` | `/api/v1/auth/logout` | `AuthGuard` | `{}` | Signs out only the current `sessionId` without disturbing other logged-in devices |
| **8** | `POST` | `/api/v1/auth/forgot-password` & `/reset-password` | `Public` | `{ email }` / `{ token, newPassword }` | Dispatches OTP/reset link and revokes all active `UserSession` records upon password reset |
| **9** | `GET` | `/api/v1/auth/me` | `AuthGuard` | Query: none | Returns full user profile, `studentProfile` autofill payload, `teacherProfile`, `clubRoles`, and current `sessionId` |

---

## 3. Module 2: Super Admin & Global Super Dashboard (`/api/v1/super-admin`) — 6 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **10** | `GET` | `/api/v1/super-admin/dashboard/charts` | `SUPER_ADMIN` | `?from=...&to=...` | Multi-university KPIs, tenant onboarding growth, total students/teachers/events/attendance charts |
| **11** | `POST` | `/api/v1/super-admin/universities` | `SUPER_ADMIN` | `{ name, shortName, code, domain, logoUrl?, location }` | Onboards a new University tenant (e.g., `CHARUSAT`) |
| **12** | `GET` | `/api/v1/super-admin/universities` | `SUPER_ADMIN` | `?page=1&limit=20&search=...` | Paginated list of all universities with department & user counts |
| **13** | `GET` | `/api/v1/super-admin/universities/:universityId` | `SUPER_ADMIN` | Param: `universityId` | Detailed university tenant profile, assigned University Admins, and department summary |
| **14** | `PATCH` | `/api/v1/super-admin/universities/:universityId` | `SUPER_ADMIN` | `{ name?, domain?, logoUrl?, isActive? }` | Updates university settings or toggles tenant active status |
| **15** | `POST` / `DELETE` | `/api/v1/super-admin/universities/:universityId/admins` (`/:userId`) | `SUPER_ADMIN` | `{ name, email, phone, password? }` | Provisions or revokes multiple Main University Admins (`UNIVERSITY_ADMIN`) |

---

## 4. Module 3: University Admin & Department Governance (`/api/v1/universities/:universityId`) — 6 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **16** | `GET` | `/api/v1/universities/:universityId/dashboard/charts` | `UNIVERSITY_ADMIN` | Param: `universityId` | University-wide Recharts analytics comparing departments (`CMPICA`, `CSPIT`, `DEPSTAR`) |
| **17** | `POST` | `/api/v1/universities/:universityId/departments` | `UNIVERSITY_ADMIN` | `{ name, code, logoUrl?, branches: ['BCA','MCA'], availableYears: [1,2,3,4] }` | Creates an academic Department (e.g., `CMPICA`) under the university |
| **18** | `GET` | `/api/v1/universities/:universityId/departments` | `AuthGuard` | Param: `universityId` | Lists all departments, academic branches, and department admins |
| **19** | `PATCH` | `/api/v1/universities/:universityId/departments/:deptId` | `UNIVERSITY_ADMIN` | `{ name?, branches?, availableYears?, isActive? }` | Updates department academic branches or batch years |
| **20** | `POST` | `/api/v1/universities/:universityId/departments/:deptId/admins` | `UNIVERSITY_ADMIN` | `{ name, email, phone }` | Assigns multiple Department Admins (`DEPARTMENT_ADMIN`) to a department like `CMPICA` |
| **21** | `DELETE` | `/api/v1/universities/:universityId/departments/:deptId/admins/:userId` | `UNIVERSITY_ADMIN` | Params: `universityId, deptId, userId` | Removes Department Admin authority from a user |

---

## 5. Module 4: Department Admin & Closed-Loop CSV Bulk Onboarding (`/api/v1/departments/:deptId`) — 7 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **22** | `POST` | `/api/v1/departments/:deptId/import/teachers-csv` | `DEPARTMENT_ADMIN` | `multipart/form-data` (`file: teachers.csv`) | Parses & validates rows via `TeacherCsvRowSchema`, upserts `TEACHER` accounts (`mustChangePassword: true`), queues credential emails, returns `CsvImportBatch` report |
| **23** | `POST` | `/api/v1/departments/:deptId/import/students-csv` | `DEPARTMENT_ADMIN` | `multipart/form-data` (`file: students.csv`) | Validates `enrollmentNo, name, email, phone, branch, batchYear, semester, classDivision`, upserts `STUDENT` accounts, queues emails, returns `CsvImportBatch` report |
| **24** | `GET` | `/api/v1/departments/:deptId/import/templates/:role` | `DEPARTMENT_ADMIN` | Param `role`: `'teacher' \| 'student'` | Downloads pre-formatted `.csv` template with valid headers and sample rows |
| **25** | `GET` | `/api/v1/departments/:deptId/import/batches` | `DEPARTMENT_ADMIN` | `?page=1&limit=20` | Returns audit history of all CSV import runs and downloadable row-error logs |
| **26** | `POST` | `/api/v1/departments/:deptId/users` | `DEPARTMENT_ADMIN` | `{ role: 'TEACHER'\|'STUDENT', name, email, phone, studentProfile?, teacherProfile? }` | Single-user manual provisioning fallback when adding a late-admission student or faculty member |
| **27** | `GET` | `/api/v1/departments/:deptId/users` | `DEPARTMENT_ADMIN \| TEACHER` | `?role=STUDENT&branch=BCA&batchYear=2&classDivision=BCA-Sem3-DivA&search=...` | Paginated directory of department teachers and students |
| **28** | `PATCH` | `/api/v1/departments/:deptId/users/:userId` | `DEPARTMENT_ADMIN` | `{ studentProfile?, teacherProfile?, isActive? }` | Updates a student's branch/semester/class division or suspends an account |

---

## 6. Module 5: Campus Clubs & Dual Co-Leadership (`/api/v1/clubs`) — 8 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **29** | `POST` | `/api/v1/clubs` | `TEACHER \| DEPARTMENT_ADMIN \| UNIVERSITY_ADMIN` | `{ name, category, description, departmentId?, facultyAdminIds[], studentRepAdminIds[] }` | Creates a campus club (e.g., *Garba Club*, *Drawing Club*) with dual Faculty + Student Co-Admin leadership |
| **30** | `GET` | `/api/v1/clubs` | `AuthGuard` | `?departmentId=...&category=...&search=...` | Lists active campus clubs in the user's university/department |
| **31** | `GET` | `/api/v1/clubs/:clubId` | `AuthGuard` | Param: `clubId` | Full club profile, Faculty Teacher Admins, Student Representative Co-Admins, member count, and upcoming club events |
| **32** | `PATCH` | `/api/v1/clubs/:clubId` | `ClubCoAdminGuard` | `{ description?, logoUrl?, bannerUrl?, isAcceptingApplications? }` | Editable by **both** the Club's Teacher Admin **and** Student Representative Co-Admin |
| **33** | `POST` | `/api/v1/clubs/:clubId/co-admins` | `TEACHER \| DEPARTMENT_ADMIN` | `{ studentUserId, action: 'PROMOTE' \| 'REVOKE' }` | Promotes a student to `STUDENT_REP_ADMIN` (`Club.studentRepAdminIds` + `User.clubRoles.studentRepClubIds`) |
| **34** | `POST` | `/api/v1/clubs/:clubId/apply` | `STUDENT` | `{ applicationReason, portfolioLink? }` | Submits a student's application to join the club using their verified profile |
| **35** | `GET` | `/api/v1/clubs/:clubId/applications` | `ClubCoAdminGuard` | `?status=PENDING` | Teacher Admin or Student Rep Co-Admin views pending student membership applications |
| **36** | `PATCH` | `/api/v1/clubs/:clubId/applications/:membershipId` | `ClubCoAdminGuard` | `{ status: 'APPROVED' \| 'REJECTED', memberRole?: 'MEMBER' \| 'CORE_COMMITTEE' }` | Approves or rejects a student club membership and sends push/in-app notification |

---

## 7. Module 6: Three-Scope Event Management (`/api/v1/events`) — 6 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **37** | `POST` | `/api/v1/events` | `TEACHER \| DEPARTMENT_ADMIN \| UNIVERSITY_ADMIN \| ClubCoAdminGuard` | `{ title, shortCaption, description, category, clubId?, posterAndMedia, scopeConfig: { scopeLevel: 'CLASS'\|'DEPARTMENT'\|'UNIVERSITY', targetDepartmentIds, targetBranches, targetBatchYears, targetClassDivisions }, venue, startTime, endTime, registrationDeadline, maxCapacity?, formConfig, authorizedScannerIds? }` | Creates a 3-scope event and optionally auto-publishes an Instagram poster card (`FeedPost`) |
| **38** | `GET` | `/api/v1/events` | `AuthGuard` | `?scopeLevel=...&category=...&clubId=...&upcoming=true` | Smart scoped query returning events eligible for the logged-in user's University, Department, Branch, Year, and Class Division |
| **39** | `GET` | `/api/v1/events/:eventId` | `AuthGuard` | Param: `eventId` | Full event details, swipeable `posterAndMedia` carousel, student eligibility check, and registration status |
| **40** | `PATCH` | `/api/v1/events/:eventId` | `EventOrganizerGuard` | Partial event fields + `authorizedScannerIds` | Updates event schedule, poster gallery, capacity, or gate scanners |
| **41** | `PATCH` | `/api/v1/events/:eventId/status` | `EventOrganizerGuard` | `{ status: 'PUBLISHED' \| 'ONGOING' \| 'COMPLETED' \| 'CANCELLED' }` | Transitions event status and triggers notifications |
| **42** | `DELETE` | `/api/v1/events/:eventId` | `EventOrganizerGuard` | Param: `eventId` | Deletes a `DRAFT` or `CANCELLED` event |

---

## 8. Module 7: 1-Click Autofill Registration & Dual QR Ticket Wallet (`/api/v1/events/:eventId`) — 5 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **43** | `GET` | `/api/v1/events/:eventId/registration-preview` | `STUDENT` | Param: `eventId` | Returns pre-filled CSV profile fields (`name, email, phone, enrollmentNo, departmentCode, branch, batchYear, classDivision`) + `customFields` |
| **44** | `POST` | `/api/v1/events/:eventId/register` | `STUDENT` | `{ customFieldAnswers?: Record<string, any> }` | Verifies 3-scope eligibility & capacity, saves `participantSnapshot`, signs HMAC-SHA256 `qrPass`, delivers QR to Mobile Wallet + queues HTML QR Ticket Email |
| **45** | `GET` | `/api/v1/users/me/tickets` | `STUDENT` | `?status=CONFIRMED` | Returns all active event tickets with `qrPayload` and `ticketCode` for the Mobile App & Web Ticket Wallet |
| **46** | `POST` | `/api/v1/events/:eventId/registrations/:regId/resend-email` | `STUDENT \| EventOrganizerGuard` | Params: `eventId, regId` | Re-queues the HTML QR Pass email via BullMQ + Nodemailer |
| **47** | `DELETE` | `/api/v1/events/:eventId/register` | `STUDENT` | Param: `eventId` | Cancels the student's registration prior to `registrationDeadline` |

---

## 9. Module 8: Live Camera QR Gate Scanning & Attendance (`/api/v1/events/:eventId/attendance`) — 4 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **48** | `POST` | `/api/v1/events/:eventId/scan-qr` | `EventScannerGuard` | `{ qrPayload, ticketCode? }` | `<150ms` HMAC-SHA256 verification; blocks duplicate check-ins (`409 ALREADY_SCANNED`); marks `attendance.isPresent = true`; broadcasts live Socket.IO counter; returns student verification card |
| **49** | `POST` | `/api/v1/events/:eventId/attendance/manual` | `EventScannerGuard` | `{ enrollmentNo }` | Manual gate check-in fallback by student Enrollment Number (`24BCA045`) |
| **50** | `GET` | `/api/v1/events/:eventId/attendance/live` | `EventScannerGuard` | Param: `eventId` | Live check-in progress (`registeredCount`, `attendedCount`, `turnoutPercentage`, and last 20 scanned attendees) |
| **51** | `GET` | `/api/v1/events/:eventId/registrations` | `EventOrganizerGuard` | `?isPresent=true&branch=BCA&batchYear=2&classDivision=BCA-Sem3-DivA&search=...` | Filterable roster table of all registered & checked-in students |

---

## 10. Module 9: Post-Event Turnout Charts & CSV/Excel Exports (`/api/v1/events/:eventId/analytics`) — 4 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **52** | `GET` | `/api/v1/events/:eventId/analytics/charts` | `EventOrganizerGuard` | Param: `eventId` | Recharts-ready datasets: `registeredVsAttended`, `branchWiseTurnout` (`BCA` vs `MCA`), `yearWiseTurnout`, `divisionWiseTurnout`, `checkInTimeSeries` |
| **53** | `GET` | `/api/v1/events/:eventId/export/csv` | `EventOrganizerGuard` | `?filter=ALL\|PRESENT_ONLY\|ABSENT_ONLY&branch=...` | Streams a 1-click `.csv` attendance sheet with Enrollment No, Name, Branch, Year, Division, Check-In Time, and Scanned By |
| **54** | `GET` | `/api/v1/events/:eventId/export/excel` | `EventOrganizerGuard` | `?filter=ALL\|PRESENT_ONLY\|ABSENT_ONLY` | Generates a formatted multi-sheet `.xlsx` workbook via `SheetJS` (`Summary`, `Present Roster`, `Absent Roster`, `Branch Breakdown`) |
| **55** | `GET` | `/api/v1/departments/:deptId/analytics/charts` | `DEPARTMENT_ADMIN` | `?from=...&to=...` | Aggregate department participation charts across all events, clubs, branches, and divisions |

---

## 11. Module 10: Instagram-Style Visual Poster Feed & Media Upload (`/api/v1/feed` & `/api/v1/media`) — 8 Endpoints

| # | Method | Route Path | Guard | Request Body / Params | Response Summary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **56** | `POST` | `/api/v1/media/upload-posters` | `TEACHER \| ClubCoAdminGuard \| DEPARTMENT_ADMIN \| UNIVERSITY_ADMIN` | `multipart/form-data` (`files[]`: up to 10 images) | Uploads `4:5`, `1:1`, or `16:9` posters/carousels to Cloudinary CDN and returns `{ url, publicId, aspectRatio }[]` |
| **57** | `GET` | `/api/v1/feed` | `AuthGuard` | `?cursor=...&limit=15&tab=FOR_YOU\|DEPARTMENT\|CLUBS` | Cursor-paginated Instagram-style poster feed filtered by the student's 3-scope eligibility, with `isLikedByMe`, `isSavedByMe`, and 1-Tap Autofill **Register Now** CTA metadata |
| **58** | `POST` | `/api/v1/feed/posts` | `TEACHER \| ClubCoAdminGuard \| DEPARTMENT_ADMIN \| UNIVERSITY_ADMIN` | `{ postType, mediaItems[], caption, hashtags[], scopeConfig, linkedEventId? }` | Publishes a visual poster or multi-image carousel post to the campus feed |
| **59** | `GET` | `/api/v1/feed/posts/:postId` | `AuthGuard` | Param: `postId` | Full poster carousel details, linked event metadata, and recent comments |
| **60** | `DELETE` | `/api/v1/feed/posts/:postId` | `AuthorOrAdminGuard` | Param: `postId` | Removes a feed post and cleans up associated interactions |
| **61** | `POST` | `/api/v1/feed/posts/:postId/like` | `AuthGuard` | Param: `postId` | Toggles a student/faculty like (heart) on an event poster and atomically updates `metrics.likesCount` |
| **62** | `POST` / `GET` | `/api/v1/feed/posts/:postId/bookmark` & `/api/v1/users/me/bookmarks` | `AuthGuard` | Param: `postId` | Bookmarks/saves an event poster to the student's personal saved collection for later registration |
| **63** | `POST` / `GET` | `/api/v1/feed/posts/:postId/comments` | `AuthGuard` | `{ commentBody }` / `?cursor=...` | Posts or retrieves student Q&A comments under an event poster |
