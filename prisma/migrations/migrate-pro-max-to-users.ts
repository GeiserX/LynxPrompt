/**
 * Migration Script: Convert Pro/Max Users to Users (FREE) tier
 * 
 * This script converts all users who previously had PRO or MAX subscriptions
 * to the new Users (FREE) tier as part of the pricing simplification.
 * 
 * New pricing model:
 * - Users (FREE): Full wizard access, all platforms, API access, sell blueprints
 * - Teams: All features + AI editing, SSO, team-shared blueprints
 * 
 * Run with: npx tsx prisma/migrations/migrate-pro-max-to-users.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../src/generated/prisma-users");

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL_USERS,
}) as {
  $queryRaw: <T>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  $executeRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<number>;
  $disconnect: () => Promise<void>;
};

async function migrateProMaxToUsers() {
  console.log("🔄 Starting migration: Pro/Max users → Users tier");
  console.log("━".repeat(50));

  try {
    // Find all users with PRO or MAX subscription plans
    // Note: The enum still contains FREE and TEAMS, but the DB may have legacy PRO/MAX values
    const proMaxUsers = await prisma.$queryRaw<{ id: string; email: string | null; subscriptionPlan: string }[]>`
      SELECT id, email, "subscriptionPlan"
      FROM "User"
      WHERE "subscriptionPlan" IN ('PRO', 'MAX')
    `;

    if (proMaxUsers.length === 0) {
      console.log("✅ No Pro/Max users found - migration complete");
      return;
    }

    console.log(`📊 Found ${proMaxUsers.length} users to migrate:`);
    proMaxUsers.forEach((user: { id: string; email: string | null; subscriptionPlan: string }) => {
      console.log(`   - ${user.email || user.id} (${user.subscriptionPlan})`);
    });

    // Update all PRO and MAX users to FREE
    const result = await prisma.$executeRaw`
      UPDATE "User"
      SET "subscriptionPlan" = 'FREE',
          "updatedAt" = NOW()
      WHERE "subscriptionPlan" IN ('PRO', 'MAX')
    `;

    console.log("━".repeat(50));
    console.log(`✅ Successfully migrated ${result} users to Users (FREE) tier`);

    // Verify the migration
    const remaining = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM "User"
      WHERE "subscriptionPlan" IN ('PRO', 'MAX')
    `;

    if (Number(remaining[0]?.count) > 0) {
      console.error("❌ WARNING: Some users were not migrated!");
    } else {
      console.log("✅ Verification passed: No PRO/MAX users remain");
    }

    // Show current distribution
    const distribution = await prisma.$queryRaw<{ subscriptionPlan: string; count: bigint }[]>`
      SELECT "subscriptionPlan", COUNT(*) as count
      FROM "User"
      GROUP BY "subscriptionPlan"
      ORDER BY count DESC
    `;

    console.log("\n📈 Current subscription distribution:");
    distribution.forEach((row: { subscriptionPlan: string; count: bigint }) => {
      const planName = row.subscriptionPlan === "FREE" ? "Users" : row.subscriptionPlan;
      console.log(`   - ${planName}: ${row.count} users`);
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateProMaxToUsers()
  .then(() => {
    console.log("\n🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });

