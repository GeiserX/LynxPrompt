/**
 * Script to promote a user to SUPERADMIN role
 * Run with: npx tsx prisma/seed-superadmin.ts <email>
 */

import { PrismaClient } from "../src/generated/prisma-users/client";

const prisma = new PrismaClient();

// Production safety guard
const PRODUCTION_HOSTNAME_PATTERNS = [
  /\.rds\.amazonaws\.com/,
  /\.azure\.com/,
  /\.gcp\.com/,
  /\.neon\.tech/,
  /\.supabase\.co/,
  /prod/i,
  /production/i,
];

function looksLikeProduction(url: string): boolean {
  return PRODUCTION_HOSTNAME_PATTERNS.some((pattern) => pattern.test(url));
}

const dbUrl = process.env.DATABASE_URL_USERS || "";
if (
  process.env.NODE_ENV === "production" &&
  looksLikeProduction(dbUrl) &&
  !process.argv.includes("--force")
) {
  console.error(
    "ERROR: Refusing to run seed script against a production database.\n" +
    `  DATABASE_URL_USERS appears to point to a production host.\n` +
    `  NODE_ENV is set to "production".\n\n` +
    "  If you really want to proceed, re-run with the --force flag:\n" +
    "    npx tsx prisma/seed-superadmin.ts <email> --force"
  );
  process.exit(1);
}

async function main() {
  const email = process.argv[2] || process.env.SUPERADMIN_EMAIL;

  if (!email) {
    console.error("Usage: npx tsx prisma/seed-superadmin.ts <email>");
    console.error("Or set SUPERADMIN_EMAIL environment variable");
    process.exit(1);
  }

  console.log(`Setting ${email} as SUPERADMIN...`);

  // Try to find the user
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update existing user to SUPERADMIN
    const updated = await prisma.user.update({
      where: { email },
      data: { role: "SUPERADMIN" },
    });
    console.log(`✅ Updated user ${updated.email} to SUPERADMIN role`);
  } else {
    // Create placeholder user that will be updated on first sign-in
    const created = await prisma.user.create({
      data: {
        email,
        role: "SUPERADMIN",
      },
    });
    console.log(`✅ Created SUPERADMIN placeholder for ${created.email}`);
    console.log("   User will be fully activated on first sign-in");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

