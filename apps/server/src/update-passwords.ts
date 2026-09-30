import prisma from "@UniSphere_cor/db";
import bcrypt from "bcrypt";

async function main() {
  console.log("Hashing password...");
  const newHash = await bcrypt.hash("Password123!", 10);
  console.log("Updating all users with new hash...");
  await prisma.user.updateMany({
    data: { passwordHash: newHash }
  });
  console.log("Done!");
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
