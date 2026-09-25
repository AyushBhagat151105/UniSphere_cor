import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: path.resolve(import.meta.dir, "../../../apps/server/.env"),
});

import prisma from "./index";

async function verifyPrismaMongoConnection() {
  console.log("1. Testing Prisma -> MongoDB transactional write (upsert CHARUSAT)...");

  const charusat = await prisma.university.upsert({
    where: { code: "CHARUSAT" },
    update: {
      isActive: true,
    },
    create: {
      name: "Charotar University of Science and Technology",
      shortName: "CHARUSAT",
      code: "CHARUSAT",
      domain: "charusat.edu.in",
      logoUrl: "/assets/charusat-logo.png",
      location: {
        city: "Changa, Anand",
        state: "Gujarat",
        country: "India",
      },
      adminIds: [],
      isActive: true,
    },
  });

  console.log("✅ Upserted University document:", charusat);

  console.log("\n2. Querying universities collection via Prisma...");
  const total = await prisma.university.count();
  const fetched = await prisma.university.findUnique({
    where: { code: "CHARUSAT" },
  });

  console.log(`✅ Total universities in DB: ${total}`);
  console.log(`✅ Fetched by unique code ('CHARUSAT'): ${fetched?.name} (_id: ${fetched?.id})`);
}

verifyPrismaMongoConnection()
  .catch((error) => {
    console.error("❌ Prisma MongoDB test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
