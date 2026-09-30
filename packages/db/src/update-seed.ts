import fs from 'fs';

let content = fs.readFileSync('src/seed.ts', 'utf8');

// Add bcrypt import
if (!content.includes('import bcrypt')) {
  content = content.replace('import prisma from "./index";', 'import prisma from "./index";\nimport bcrypt from "bcrypt";');
}

// Add variable at the start of seed function
if (!content.includes('const defaultPasswordHash')) {
  content = content.replace('async function seed() {', 'async function seed() {\n  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);\n');
}

// Replace the hardcoded strings with the variable
content = content.replace(/passwordHash: "\$2b\$10\$[a-zA-Z0-9.\/]+"/g, 'passwordHash: defaultPasswordHash');

// Delete exact lines that fail: clubRoles block
content = content.replace(/\s*clubRoles:\s*\{\s*facultyAdminClubIds:\s*\[\],\s*studentRepClubIds:\s*\[\]\s*\},?/g, '');
const syncRegex = /\/\/ Sync User\.clubRoles with assigned clubs[\s\S]*?\/\/ 7\. Club Memberships/;
content = content.replace(syncRegex, '// 7. Club Memberships');

// Fix Upserts lacking passwordHash update for user exactly (so they can rotate on run)
// Find lines matching `role: "..."` inside update: { }, which only applies to User upserts.
// Since User updates usually have `role:` string, we can inject it right after.
content = content.replace(/(update:\s*{[^}]*role:\s*"[^"]*",?)/g, '$1\n      passwordHash: defaultPasswordHash,');


fs.writeFileSync('src/seed.ts', content);
