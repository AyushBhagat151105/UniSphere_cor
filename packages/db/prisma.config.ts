import type { PrismaConfig } from "prisma";

import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
  path: "../../apps/server/.env",
});

export default {
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
} satisfies PrismaConfig;
