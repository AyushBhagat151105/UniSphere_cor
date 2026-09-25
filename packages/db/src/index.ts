import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "../prisma/generated/client";

if (!process.env.DATABASE_URL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({
    path: path.resolve(__dirname, "../../../apps/server/.env"),
  });
}

const prisma = new PrismaClient();

export default prisma;
export * from "../prisma/generated/client";
