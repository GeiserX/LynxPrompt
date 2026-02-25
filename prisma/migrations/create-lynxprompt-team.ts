/**
 * Script to create the LynxPrompt team and assign dev@lynxprompt.com as admin
 * 
 * Run with:
 *   npx tsx prisma/migrations/create-lynxprompt-team.ts
 * 
 * Make sure DATABASE_URL_USERS is set in your environment
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("../../src/generated/prisma-users/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pg = require("pg");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL_USERS,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function createLynxPromptTeam() {
  console.log("🚀 Creating LynxPrompt team...");
  console.log("━".repeat(50));

  const TEAM_NAME = "LynxPrompt";
  const TEAM_SLUG = "lynxprompt";
  const ADMIN_EMAIL = "dev@lynxprompt.com";

  try {
    // Check if team already exists
    const existingTeam = await prisma.team.findUnique({
      where: { slug: TEAM_SLUG },
    });

    if (existingTeam) {
      console.log(`✅ Team "${TEAM_NAME}" already exists (ID: ${existingTeam.id})`);
      
      // Check if admin is already a member
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          teamId: existingTeam.id,
          user: { email: ADMIN_EMAIL },
        },
        include: { user: true },
      });

      if (existingMember) {
        console.log(`✅ ${ADMIN_EMAIL} is already a member (role: ${existingMember.role})`);
        
        // Ensure they're an admin
        if (existingMember.role !== "ADMIN") {
          await prisma.teamMember.update({
            where: { id: existingMember.id },
            data: { role: "ADMIN" },
          });
          console.log(`✅ Promoted ${ADMIN_EMAIL} to ADMIN`);
        }
      } else {
        // Find or create the admin user
        let adminUser = await prisma.user.findUnique({
          where: { email: ADMIN_EMAIL },
        });

        if (!adminUser) {
          adminUser = await prisma.user.create({
            data: {
              email: ADMIN_EMAIL,
              name: "LynxPrompt Dev",
              subscriptionPlan: "TEAMS",
            },
          });
          console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
        }

        // Add admin to team
        await prisma.teamMember.create({
          data: {
            teamId: existingTeam.id,
            userId: adminUser.id,
            role: "ADMIN",
            isActiveThisCycle: true,
          },
        });
        console.log(`✅ Added ${ADMIN_EMAIL} as ADMIN to team`);
      }

      return existingTeam;
    }

    // Find or create the admin user
    let adminUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          name: "LynxPrompt Dev",
          subscriptionPlan: "TEAMS",
        },
      });
      console.log(`✅ Created admin user: ${ADMIN_EMAIL}`);
    } else {
      // Update subscription plan to TEAMS if not already
      if (adminUser.subscriptionPlan !== "TEAMS") {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { subscriptionPlan: "TEAMS" },
        });
        console.log(`✅ Updated ${ADMIN_EMAIL} to TEAMS plan`);
      }
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name: TEAM_NAME,
        slug: TEAM_SLUG,
        maxSeats: 10,
        members: {
          create: {
            userId: adminUser.id,
            role: "ADMIN",
            isActiveThisCycle: true,
          },
        },
      },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    console.log("━".repeat(50));
    console.log(`✅ Team created successfully!`);
    console.log(`   ID: ${team.id}`);
    console.log(`   Name: ${team.name}`);
    console.log(`   Slug: ${team.slug}`);
    console.log(`   Max Seats: ${team.maxSeats}`);
    console.log(`   Members:`);
    team.members.forEach((m) => {
      console.log(`     - ${m.user.email} (${m.role})`);
    });

    return team;
  } catch (error) {
    console.error("❌ Error creating team:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createLynxPromptTeam()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });

