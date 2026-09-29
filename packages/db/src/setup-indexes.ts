import prisma from "./index";

/**
 * Creates MongoDB indexes that Prisma's schema DSL cannot express natively.
 *
 * Run this once after `db:push` via `bun run db:indexes`.
 * It is idempotent — MongoDB skips creation if an index with the same name already exists.
 */
async function setupIndexes() {
  // Partial unique index: enrollmentNo must be unique per university, but only for STUDENT users.
  // Teachers do not have an enrollmentNo, so a full unique index would wrongly block their documents.
  await prisma.$runCommandRaw({
    createIndexes: "users",
    indexes: [
      {
        key: { "studentProfile.enrollmentNo": 1, universityId: 1 },
        name: "unique_enrollment_per_university",
        unique: true,
        partialFilterExpression: { role: "STUDENT" },
      },
    ],
  });

  console.log("✅ Partial unique index 'unique_enrollment_per_university' on users created");
}

setupIndexes()
  .catch((err) => {
    console.error("❌ setup-indexes failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
