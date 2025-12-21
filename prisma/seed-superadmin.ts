/**
 * Script to promote a user to SUPERADMIN role
 * Run with: npx tsx prisma/seed-superadmin.ts <email>
 */

import { PrismaClient } from "@prisma/client-users";

const prisma = new PrismaClient();

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




