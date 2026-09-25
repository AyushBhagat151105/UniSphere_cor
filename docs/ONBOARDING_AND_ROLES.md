# UniSphere — Closed-Loop CSV Onboarding & 5-Tier RBAC Guide

<div align="center">
  <img src="../assets/charusat-logo.png" alt="CHARUSAT University" width="360" />
</div>

---

## 1. Why Closed-Loop CSV Onboarding?

In a university ecosystem like **CHARUSAT (`CMPICA`)**, allowing public self-registration causes fake accounts, typo-ridden enrollment numbers, wrong class divisions, and broken event attendance reports.

UniSphere solves this with **Closed-Loop CSV Provisioning**:
1. **Zero Public Signup**: Only a `DEPARTMENT_ADMIN` can onboard Teachers and Students into their department via `.csv` bulk upload (or single-user admin fallback).
2. **Trusted Autofill Source**: Because the Department Admin imports `enrollmentNo`, `name`, `email`, `phone`, `branch`, `batchYear`, `semester`, and `classDivision` directly from official academic records, every student can register for campus events in **1 click** with zero manual typing.
3. **Mandatory First-Login Password Change**: Every CSV-imported account starts with `mustChangePassword: true`. On their first login (`POST /api/v1/auth/login`), the user is required to call `POST /api/v1/auth/activate-account` to set their personal password before accessing any feed or event routes.

---

## 2. CSV Templates & Zod Validation Schemas

### 2.1 Student Roster CSV (`students.csv`)
Uploaded via `POST /api/v1/departments/:deptId/import/students-csv`.

#### Required CSV Columns
| Column Header | Example Value | Validation Rule (`StudentCsvRowSchema`) |
| :--- | :--- | :--- |
| `enrollmentNo` | `24BCA045` | Required, uppercase alphanumeric, unique within `universityId` |
| `name` | `Aarav Patel` | Required, 2–100 characters |
| `email` | `24bca045@charusat.edu.in` | Required, valid lowercase email, unique globally |
| `phone` | `9876543210` | Required, 10–15 digit phone number |
| `branch` | `BCA` | Required, must match `department.branches[]` (e.g., `BCA`, `MCA`, `B.Sc(IT)`) |
| `batchYear` | `2` | Required integer (`1`, `2`, `3`, or `4`), must match `department.availableYears[]` |
| `semester` | `3` | Required integer (`1` to `8`) |
| `classDivision` | `BCA-Sem3-DivA` | Required division tag used by `CLASS`-scope event filters |
| `cgpa` *(Optional — Team 3 Hook)* | `8.65` | Optional float (`0.0` to `10.0`) used by Team 3 Placement Cell |
| `isAlumni` *(Optional — Team 2 Hook)* | `false` | Optional boolean (`true` / `false`) used by Team 2 Alumni Network |

#### Sample `students.csv`
```csv
enrollmentNo,name,email,phone,branch,batchYear,semester,classDivision,cgpa,isAlumni
24BCA045,Aarav Patel,24bca045@charusat.edu.in,9876543210,BCA,2,3,BCA-Sem3-DivA,8.65,false
24BCA046,Diya Shah,24bca046@charusat.edu.in,9876543211,BCA,2,3,BCA-Sem3-DivA,9.10,false
25MCA012,Rohan Desai,25mca012@charusat.edu.in,9876543212,MCA,1,1,MCA-Sem1-DivB,8.40,false
```

---

### 2.2 Teacher / Faculty Roster CSV (`teachers.csv`)
Uploaded via `POST /api/v1/departments/:deptId/import/teachers-csv`.

#### Required CSV Columns
| Column Header | Example Value | Validation Rule (`TeacherCsvRowSchema`) |
| :--- | :--- | :--- |
| `employeeId` | `EMP-CMP-104` | Required, unique within `universityId` |
| `name` | `Prof. Neha Mehta` | Required, 2–100 characters |
| `email` | `nehamehta.mca@charusat.ac.in` | Required, valid lowercase email |
| `phone` | `9898012345` | Required, 10–15 digit phone number |
| `designation` | `Assistant Professor` | Required string (e.g., `Assistant Professor`, `Associate Professor`, `HOD`) |
| `cabinNo` *(Optional)* | `CMPICA-204` | Optional faculty cabin/room identifier |

#### Sample `teachers.csv`
```csv
employeeId,name,email,phone,designation,cabinNo
EMP-CMP-104,Prof. Neha Mehta,nehamehta.mca@charusat.ac.in,9898012345,Assistant Professor,CMPICA-204
EMP-CMP-108,Dr. Karan Joshi,karanjoshi.bca@charusat.ac.in,9898012346,Associate Professor,CMPICA-110
```

---

## 3. Complete 5-Tier + Club Co-Admin Permission Matrix

| Capability / Action | Tier 1: `SUPER_ADMIN` | Tier 2: `UNIVERSITY_ADMIN` | Tier 3: `DEPARTMENT_ADMIN` | Tier 4: `TEACHER` | Tier 5A: `STUDENT_REP_ADMIN` *(Club Co-Admin)* | Tier 5B: `STUDENT` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Onboard New University Tenant & Assign University Admins** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Global Multi-University Super Dashboard** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create Academic Departments (`CMPICA`, `CSPIT`) & Assign Dept Admins** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Upload Teacher & Student Onboarding CSVs (`teachers.csv`, `students.csv`)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create Campus Clubs (`Garba Club`, `Drawing Club`)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Promote Student to Club Representative Co-Admin (`STUDENT_REP_ADMIN`)** | ✅ | ✅ | ✅ | ✅ *(Club Faculty Admin)* | ❌ | ❌ |
| **Approve/Reject Club Member Applications (`ClubCoAdminGuard`)** | ✅ | ✅ | ✅ | ✅ *(Club Faculty Admin)* | ✅ *(Assigned Club)* | ❌ |
| **Create Events (`CLASS`, `DEPARTMENT`, `UNIVERSITY` Scopes)** | ✅ | ✅ | ✅ | ✅ | ✅ *(Club Events)* | ❌ |
| **Post Event Posters & Photo Carousels to Campus Feed** | ✅ | ✅ | ✅ | ✅ | ✅ *(Club Posts)* | ❌ |
| **Scan QR Tickets at Event Gate (`EventScannerGuard`)** | ✅ | ✅ | ✅ | ✅ | ✅ *(Authorized Events)* | ❌ *(Unless Authorized Volunteer)* |
| **View Recharts Turnout & Export `.csv` / `.xlsx` Attendance Sheets** | ✅ | ✅ | ✅ | ✅ *(Own/Club Events)* | ✅ *(Club Events)* | ❌ |
| **Browse Scoped Poster Feed, Like, Comment & Bookmark** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **1-Click Autofill Event Registration & Receive Mobile + Email QR Ticket** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
