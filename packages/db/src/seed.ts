import prisma from "./index";
import bcrypt from "bcrypt";

async function seed() {
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  console.log("🌱 Seeding UniSphere_cor MongoDB across all 14 collections...\n");

  // Clean existing dependent records to ensure idempotent runs
  await prisma.postInteraction.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.feedPost.deleteMany({});
  await prisma.eventRegistration.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.clubMembership.deleteMany({});
  await prisma.club.deleteMany({});
  await prisma.alumniMentorship.deleteMany({});
  await prisma.placementDrive.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.csvImportBatch.deleteMany({});

  // 1. University (CHARUSAT + DDIT)
  const charusat = await prisma.university.upsert({
    where: { code: "CHARUSAT" },
    update: {
      name: "Charotar University of Science and Technology",
      shortName: "CHARUSAT",
      domain: "charusat.edu.in",
      logoUrl: "/assets/charusat-logo.png",
      location: { city: "Changa, Anand", state: "Gujarat", country: "India" },
      isActive: true,
    },
    create: {
      name: "Charotar University of Science and Technology",
      shortName: "CHARUSAT",
      code: "CHARUSAT",
      domain: "charusat.edu.in",
      logoUrl: "/assets/charusat-logo.png",
      location: { city: "Changa, Anand", state: "Gujarat", country: "India" },
      isActive: true,
    },
  });

  await prisma.university.upsert({
    where: { code: "DDU" },
    update: {
      name: "Dharmsinh Desai University",
      shortName: "DDU",
      domain: "ddu.ac.in",
      location: { city: "Nadiad", state: "Gujarat", country: "India" },
      isActive: true,
    },
    create: {
      name: "Dharmsinh Desai University",
      shortName: "DDU",
      code: "DDU",
      domain: "ddu.ac.in",
      location: { city: "Nadiad", state: "Gujarat", country: "India" },
      isActive: true,
    },
  });

  // 2. Departments under CHARUSAT (CMPICA & CSPIT)
  const cmpica = await prisma.department.upsert({
    where: {
      universityId_code: {
        universityId: charusat.id,
        code: "CMPICA",
      },
    },
    update: {
      name: "Smt. Chandaben Mohanbhai Patel Institute of Computer Applications",
      logoUrl: "/assets/cmpica-logo.png",
      branches: ["BCA", "MCA", "B.Sc(IT)", "M.Sc(IT)"],
      availableYears: [1, 2, 3, 4],
      isActive: true,
    },
    create: {
      universityId: charusat.id,
      name: "Smt. Chandaben Mohanbhai Patel Institute of Computer Applications",
      code: "CMPICA",
      logoUrl: "/assets/cmpica-logo.png",
      branches: ["BCA", "MCA", "B.Sc(IT)", "M.Sc(IT)"],
      availableYears: [1, 2, 3, 4],
      isActive: true,
    },
  });

  const cspit = await prisma.department.upsert({
    where: {
      universityId_code: {
        universityId: charusat.id,
        code: "CSPIT",
      },
    },
    update: {
      name: "Chandubhai S. Patel Institute of Technology",
      branches: ["CE", "IT", "CSE", "EC"],
      availableYears: [1, 2, 3, 4],
      isActive: true,
    },
    create: {
      universityId: charusat.id,
      name: "Chandubhai S. Patel Institute of Technology",
      code: "CSPIT",
      branches: ["CE", "IT", "CSE", "EC"],
      availableYears: [1, 2, 3, 4],
      isActive: true,
    },
  });

  // 3. Users across all 5 RBAC Tiers
  // Tier 1: SUPER_ADMIN (CHARUSAT Dev Club Manager)
  const superAdmin = await prisma.user.upsert({
    where: { email: "ayush.devclub@charusat.edu.in" },
    update: {
      name: "Ayush Bhagat (Dev Club Lead)",
      role: "SUPER_ADMIN",
      passwordHash: defaultPasswordHash,
      universityId: charusat.id,
      departmentId: cmpica.id,
      mustChangePassword: false,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "SUPER_ADMIN",
      name: "Ayush Bhagat (Dev Club Lead)",
      email: "ayush.devclub@charusat.edu.in",
      phone: "+919876543210",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
    },
  });

  // Tier 2: UNIVERSITY_ADMIN (Multiple per University)
  const uniAdmin1 = await prisma.user.upsert({
    where: { email: "registrar@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      role: "UNIVERSITY_ADMIN",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
    },
    create: {
      universityId: charusat.id,
      role: "UNIVERSITY_ADMIN",
      name: "Dr. Devang Joshi (CHARUSAT Registrar)",
      email: "registrar@charusat.edu.in",
      phone: "+919876543211",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
    },
  });

  // Tier 3: DEPARTMENT_ADMIN (CMPICA HOD / Admin)
  const deptAdmin = await prisma.user.upsert({
    where: { email: "hod.cmpica@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "DEPARTMENT_ADMIN",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "DEPARTMENT_ADMIN",
      name: "Dr. Atul Patel (Dean & Principal, CMPICA)",
      email: "hod.cmpica@charusat.edu.in",
      phone: "+919876543212",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
    },
  });

  // Update University & Department adminIds[]
  await prisma.university.update({
    where: { id: charusat.id },
    data: { adminIds: [uniAdmin1.id], createdBy: superAdmin.id },
  });
  await prisma.department.update({
    where: { id: cmpica.id },
    data: { adminIds: [deptAdmin.id], createdBy: uniAdmin1.id },
  });

  // 4. CSV Import Batch (Audit log of Department Admin CSV upload)
  const csvBatch = await prisma.csvImportBatch.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      uploadedBy: deptAdmin.id,
      importType: "STUDENTS",
      fileName: "cmpica_bca_sem3_divA_2026.csv",
      summary: {
        totalRows: 120,
        createdCount: 118,
        updatedCount: 2,
        failedCount: 0,
      },
      rowErrors: [],
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  // Tier 4: TEACHER (Faculty Coordinator & Event Organizer)
  const teacherProf = await prisma.user.upsert({
    where: { email: "arpit.trivedi@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "TEACHER",
      passwordHash: defaultPasswordHash,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "TEACHER",
      name: "Prof. Arpit Trivedi",
      email: "arpit.trivedi@charusat.edu.in",
      phone: "+919876543213",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      teacherProfile: {
        employeeId: "CMPICA-FAC-104",
        designation: "Assistant Professor",
        cabinNo: "CMPICA-208",
      },
      provisionedBy: deptAdmin.id,
    },
  });

  // Tier 5: STUDENT & STUDENT_REP_ADMIN (Club Co-Admin)
  const studentRep = await prisma.user.upsert({
    where: { email: "24bca045@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      passwordHash: defaultPasswordHash,
      importBatchId: csvBatch.id,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      name: "Komal Patel",
      email: "24bca045@charusat.edu.in",
      phone: "+919876543214",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      studentProfile: {
        enrollmentNo: "24BCA045",
        branch: "BCA",
        batchYear: 2,
        semester: 3,
        classDivision: "Div-A",
        cgpa: 8.92,
        skills: ["TypeScript", "React", "UI/UX", "Event Management"],
        resumeUrl: "https://res.cloudinary.com/unisphere/komal-resume.pdf",
        isAlumni: false,
      },
      importBatchId: csvBatch.id,
      provisionedBy: deptAdmin.id,
    },
  });

  // Tier 5: Regular STUDENT (BCA Sem 3 Div-A)
  const studentMember = await prisma.user.upsert({
    where: { email: "24bca088@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      passwordHash: defaultPasswordHash,
      importBatchId: csvBatch.id,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      name: "Harshvardhan Parmar",
      email: "24bca088@charusat.edu.in",
      phone: "+919876543215",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      studentProfile: {
        enrollmentNo: "24BCA088",
        branch: "BCA",
        batchYear: 2,
        semester: 3,
        classDivision: "Div-A",
        cgpa: 8.45,
        skills: ["Node.js", "MongoDB", "Flutter"],
        isAlumni: false,
      },
      importBatchId: csvBatch.id,
      provisionedBy: deptAdmin.id,
    },
  });

  // Tier 5: Alumni Student (for Team 2 Alumni Mentorship)
  const alumniUser = await prisma.user.upsert({
    where: { email: "21mca012@charusat.edu.in" },
    update: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      passwordHash: defaultPasswordHash,
    },
    create: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      role: "STUDENT",
      name: "Rohan Desai (CMPICA Alumni)",
      email: "21mca012@charusat.edu.in",
      phone: "+919876543216",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      studentProfile: {
        enrollmentNo: "21MCA012",
        branch: "MCA",
        batchYear: 4,
        semester: 4,
        classDivision: "Div-A",
        cgpa: 9.15,
        skills: ["Distributed Systems", "Go", "Kubernetes"],
        isAlumni: true,
        graduationYear: 2023,
        currentCompany: "Razorpay",
      },
    },
  });

  // 5. Multi-Device UserSession (Web + React Native Android)
  await prisma.userSession.createMany({
    data: [
      {
        userId: studentRep.id,
        universityId: charusat.id,
        refreshTokenHash: "sha256_web_session_token_komal_001",
        deviceMetadata: {
          deviceId: "web-fedora-chrome-01",
          deviceName: "Chrome 132 on Fedora Linux",
          platform: "WEB",
          ipAddress: "10.10.42.18",
          userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        userId: studentRep.id,
        universityId: charusat.id,
        refreshTokenHash: "sha256_android_session_token_komal_002",
        deviceMetadata: {
          deviceId: "android-pixel8-expo-02",
          deviceName: "Google Pixel 8 Pro (UniSphere App)",
          platform: "ANDROID",
          ipAddress: "10.10.42.99",
          userAgent: "Expo/54.0.0 ReactNative/0.81",
          expoPushToken: "ExponentPushToken[charusat_komal_pixel8_token]",
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // 6. Campus Clubs with Dual Co-Leadership (Faculty Admin + Student Rep Co-Admin)
  const devClub = await prisma.club.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      name: "CHARUSAT Development Club",
      slug: "charusat-dev-club",
      category: "TECHNICAL",
      description:
        "Official student-faculty software engineering club at CMPICA building UniSphere and campus open-source products.",
      logoUrl: "/assets/clube-logo.jpeg",
      facultyAdminIds: [teacherProf.id],
      studentRepAdminIds: [studentRep.id],
      memberCount: 32,
      isAcceptingApplications: true,
      createdBy: teacherProf.id,
    },
  });

  const garbaClub = await prisma.club.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      name: "CMPICA Garba & Cultural Club",
      slug: "cmpica-garba-club",
      category: "CULTURAL",
      description:
        "Organizes Spoural cultural nights, Navratri Raas-Garba महोत्सव, and inter-department folk dance competitions.",
      facultyAdminIds: [teacherProf.id],
      studentRepAdminIds: [studentRep.id],
      memberCount: 85,
      isAcceptingApplications: true,
      createdBy: teacherProf.id,
    },
  });

  await prisma.club.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      name: "Canvas & Sketching Club",
      slug: "canvas-sketching-club",
      category: "ARTS",
      description:
        "Fine arts, live portrait sketching, poster illustration, and digital design community of CMPICA.",
      facultyAdminIds: [teacherProf.id],
      studentRepAdminIds: [studentRep.id],
      memberCount: 44,
      isAcceptingApplications: true,
      createdBy: teacherProf.id,
    },
  });

  // 7. Club Memberships
  await prisma.clubMembership.createMany({
    data: [
      {
        clubId: devClub.id,
        universityId: charusat.id,
        departmentId: cmpica.id,
        studentId: studentRep.id,
        memberRole: "STUDENT_REP_ADMIN",
        applicationReason: "Lead frontend & club representative for Team 1.",
        status: "APPROVED",
        reviewedBy: teacherProf.id,
        reviewedAt: new Date(),
        joinedAt: new Date(),
      },
      {
        clubId: devClub.id,
        universityId: charusat.id,
        departmentId: cmpica.id,
        studentId: studentMember.id,
        memberRole: "CORE_COMMITTEE",
        applicationReason: "Fullstack developer experienced with Bun, Express, and Prisma.",
        portfolioLink: "https://github.com/harshvardhan-cmpica",
        status: "APPROVED",
        reviewedBy: studentRep.id,
        reviewedAt: new Date(),
        joinedAt: new Date(),
      },
    ],
  });

  // 8. Three-Scope Events (UNIVERSITY, DEPARTMENT, CLASS)
  const hackathonEvent = await prisma.event.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      clubId: devClub.id,
      title: "UniSphere Fullstack Hackathon 2026",
      slug: "unisphere-hackathon-2026",
      shortCaption: "36-hour campus innovation sprint by CHARUSAT Development Club",
      description:
        "Build production-ready campus tools using Bun, Express, Prisma, React 19, and Expo. Open to all CHARUSAT departments with ₹50,000 prize pool.",
      category: "COMPETITION",
      posterAndMedia: {
        posterUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080",
        galleryImages: [
          {
            url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080",
            publicId: "unisphere/events/hackathon-poster",
            aspectRatio: "4:5",
            caption: "Official Hackathon Poster",
          },
        ],
      },
      scopeConfig: {
        scopeLevel: "UNIVERSITY",
        targetDepartmentIds: [cmpica.id, cspit.id],
        targetBranches: [],
        targetBatchYears: [],
        targetClassDivisions: [],
      },
      venue: "CMPICA Central Auditorium, CHARUSAT Campus",
      startTime: new Date("2026-10-15T09:00:00.000Z"),
      endTime: new Date("2026-10-16T18:00:00.000Z"),
      registrationDeadline: new Date("2026-10-12T23:59:59.000Z"),
      maxCapacity: 250,
      formConfig: {
        autofillFields: [
          "name",
          "email",
          "phone",
          "enrollmentNo",
          "department",
          "branch",
          "batchYear",
          "classDivision",
        ],
        customFields: [
          {
            key: "githubUrl",
            label: "GitHub Profile Link",
            type: "TEXT",
            options: [],
            required: true,
          },
          {
            key: "tshirtSize",
            label: "T-Shirt Size",
            type: "SELECT",
            options: ["S", "M", "L", "XL"],
            required: true,
          },
        ],
      },
      authorizedScannerIds: [teacherProf.id, studentRep.id],
      registeredCount: 2,
      attendedCount: 1,
      likesCount: 94,
      bookmarksCount: 41,
      status: "PUBLISHED",
      createdBy: teacherProf.id,
    },
  });

  const garbaEvent = await prisma.event.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      clubId: garbaClub.id,
      title: "CMPICA Navratri Raas-Garba Night 2026",
      slug: "cmpica-raas-garba-2026",
      shortCaption: "Traditional Garba evening exclusively for CMPICA students & faculty",
      description:
        "Join us at the CMPICA Central Lawn for live dhol, traditional attire competition, and Garba celebration.",
      category: "CULTURAL",
      posterAndMedia: {
        posterUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1080",
        galleryImages: [],
      },
      scopeConfig: {
        scopeLevel: "DEPARTMENT",
        targetDepartmentIds: [cmpica.id],
        targetBranches: ["BCA", "MCA", "B.Sc(IT)", "M.Sc(IT)"],
        targetBatchYears: [1, 2, 3, 4],
        targetClassDivisions: [],
      },
      venue: "CMPICA Amphitheatre Lawn",
      startTime: new Date("2026-10-20T18:30:00.000Z"),
      endTime: new Date("2026-10-20T22:30:00.000Z"),
      registrationDeadline: new Date("2026-10-19T17:00:00.000Z"),
      maxCapacity: 500,
      formConfig: {
        autofillFields: [
          "name",
          "email",
          "phone",
          "enrollmentNo",
          "department",
          "branch",
          "batchYear",
          "classDivision",
        ],
        customFields: [],
      },
      authorizedScannerIds: [teacherProf.id, studentRep.id],
      registeredCount: 1,
      attendedCount: 0,
      likesCount: 142,
      bookmarksCount: 67,
      status: "PUBLISHED",
      createdBy: studentRep.id,
    },
  });

  // 9. Event Registrations with 1-Click Autofill Snapshot & Dual QR Pass
  await prisma.eventRegistration.createMany({
    data: [
      {
        eventId: hackathonEvent.id,
        universityId: charusat.id,
        departmentId: cmpica.id,
        studentId: studentMember.id,
        participantSnapshot: {
          name: studentMember.name,
          email: studentMember.email,
          phone: studentMember.phone,
          enrollmentNo: "24BCA088",
          departmentCode: "CMPICA",
          branch: "BCA",
          batchYear: 2,
          classDivision: "Div-A",
        },
        customFieldAnswers: {
          githubUrl: "https://github.com/harshvardhan-cmpica",
          tshirtSize: "L",
        },
        qrPass: {
          ticketCode: "UNI-2026-HACK-0088",
          qrSignature: "hmac_sha256_9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
          qrPayload: JSON.stringify({
            v: 1,
            regId: "UNI-2026-HACK-0088",
            eventId: hackathonEvent.id,
            enrollmentNo: "24BCA088",
          }),
          mobileDelivered: true,
          emailSentAt: new Date(),
          emailStatus: "SENT",
        },
        attendance: {
          isPresent: true,
          checkedInAt: new Date(),
          scannedBy: studentRep.id,
          entryMethod: "QR_CAMERA_SCAN",
        },
        status: "ATTENDED",
      },
      {
        eventId: garbaEvent.id,
        universityId: charusat.id,
        departmentId: cmpica.id,
        studentId: studentRep.id,
        participantSnapshot: {
          name: studentRep.name,
          email: studentRep.email,
          phone: studentRep.phone,
          enrollmentNo: "24BCA045",
          departmentCode: "CMPICA",
          branch: "BCA",
          batchYear: 2,
          classDivision: "Div-A",
        },
        customFieldAnswers: {},
        qrPass: {
          ticketCode: "UNI-2026-GARBA-0045",
          qrSignature: "hmac_sha256_4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
          qrPayload: JSON.stringify({
            v: 1,
            regId: "UNI-2026-GARBA-0045",
            eventId: garbaEvent.id,
            enrollmentNo: "24BCA045",
          }),
          mobileDelivered: true,
          emailSentAt: new Date(),
          emailStatus: "SENT",
        },
        attendance: {
          isPresent: false,
        },
        status: "CONFIRMED",
      },
    ],
  });

  // 10. Instagram-Style Poster Feed Posts
  const feedPost1 = await prisma.feedPost.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      clubId: devClub.id,
      linkedEventId: hackathonEvent.id,
      authorId: studentRep.id,
      authorBadge: "CHARUSAT Dev Club • Student Co-Admin",
      postType: "EVENT_POSTER",
      mediaItems: [
        {
          url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1080",
          publicId: "unisphere/feed/hackathon-poster-main",
          aspectRatio: "4:5",
          caption: "Swipe to see the tracks & prizes →",
        },
      ],
      caption:
        "🚀 Registrations are LIVE for the UniSphere Fullstack Hackathon 2026! Tap 'Register in 1-Click' to autofill your CMPICA profile and receive your instant QR Gate Pass in your mobile wallet & email.",
      hashtags: ["#CHARUSAT", "#CMPICA", "#DevClub", "#UniSphere", "#Hackathon2026"],
      scopeConfig: {
        scopeLevel: "UNIVERSITY",
        targetDepartmentIds: [cmpica.id, cspit.id],
        targetBranches: [],
        targetBatchYears: [],
        targetClassDivisions: [],
      },
      metrics: {
        likesCount: 94,
        commentsCount: 18,
        bookmarksCount: 41,
      },
      isPinned: true,
    },
  });

  // 11. Post Interactions (Likes, Bookmarks, Comments)
  await prisma.postInteraction.createMany({
    data: [
      {
        postId: feedPost1.id,
        userId: studentMember.id,
        type: "LIKE",
      },
      {
        postId: feedPost1.id,
        userId: studentMember.id,
        type: "BOOKMARK",
      },
      {
        postId: feedPost1.id,
        userId: studentMember.id,
        type: "COMMENT",
        commentBody: "Registered in 1 click! Got the QR pass in my email and app wallet 🔥",
      },
    ],
  });

  // 12. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: studentMember.id,
        universityId: charusat.id,
        type: "QR_TICKET_ISSUED",
        title: "🎟️ Your QR Gate Pass is Ready!",
        body: "Ticket UNI-2026-HACK-0088 for UniSphere Fullstack Hackathon 2026 has been added to your Wallet and sent to 24bca088@charusat.edu.in.",
        actionUrl: "/wallet/tickets/UNI-2026-HACK-0088",
        isRead: false,
      },
      {
        userId: studentRep.id,
        universityId: charusat.id,
        type: "CLUB_ROLE_ASSIGNED",
        title: "🌟 Promoted to Club Co-Admin",
        body: "Prof. Arpit Trivedi added you as Student Representative Co-Admin for CHARUSAT Development Club.",
        actionUrl: "/clubs/charusat-dev-club/manage",
        isRead: true,
      },
    ],
  });

  // 13. Team 2 Addon: Alumni Mentorship
  await prisma.alumniMentorship.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      alumniUserId: alumniUser.id,
      title: "Cracking Product Engineering Internships from CMPICA",
      topic: "Backend System Design, Open Source & Resume Review",
      companyName: "Razorpay",
      linkedEventId: hackathonEvent.id,
      availableSlots: 25,
      status: "OPEN",
    },
  });

  // 14. Team 3 Addon: Campus Placement Drive
  await prisma.placementDrive.create({
    data: {
      universityId: charusat.id,
      departmentId: cmpica.id,
      companyName: "Tata Consultancy Services (TCS Digital)",
      jobTitle: "Fullstack Systems Engineer",
      packageLPA: 7.5,
      description:
        "Campus placement drive for final-year BCA & MCA students at CHARUSAT CMPICA.",
      eligibility: {
        allowedBranches: ["BCA", "MCA", "M.Sc(IT)"],
        minCgpa: 7.0,
        batchYear: 2,
      },
      applicationDeadline: new Date("2026-11-01T18:00:00.000Z"),
      createdBy: deptAdmin.id,
      status: "OPEN",
    },
  });

  // Summary printout
  const counts = {
    universities: await prisma.university.count(),
    departments: await prisma.department.count(),
    users: await prisma.user.count(),
    userSessions: await prisma.userSession.count(),
    csvImportBatches: await prisma.csvImportBatch.count(),
    clubs: await prisma.club.count(),
    clubMemberships: await prisma.clubMembership.count(),
    events: await prisma.event.count(),
    eventRegistrations: await prisma.eventRegistration.count(),
    feedPosts: await prisma.feedPost.count(),
    postInteractions: await prisma.postInteraction.count(),
    notifications: await prisma.notification.count(),
    alumniMentorships: await prisma.alumniMentorship.count(),
    placementDrives: await prisma.placementDrive.count(),
  };

  console.log("✅ Seed completed! Document counts in MongoDB (UniSphere_cor):");
  console.table(counts);
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
