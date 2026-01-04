import { PrismaClient } from "../src/generated/prisma-support/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_SUPPORT,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding support database...");

  // Create default categories
  const categories = [
    {
      name: "Bug Reports",
      slug: "bugs",
      description: "Report bugs, issues, or unexpected behavior",
      icon: "Bug",
      color: "red",
      order: 1,
    },
    {
      name: "Feature Requests",
      slug: "features",
      description: "Suggest new features or improvements",
      icon: "Lightbulb",
      color: "amber",
      order: 2,
    },
    {
      name: "Questions",
      slug: "questions",
      description: "Ask questions about using LynxPrompt",
      icon: "HelpCircle",
      color: "blue",
      order: 3,
    },
    {
      name: "General Feedback",
      slug: "feedback",
      description: "Share your thoughts and general feedback",
      icon: "MessageSquare",
      color: "green",
      order: 4,
    },
  ];

  for (const category of categories) {
    await prisma.supportCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    console.log(`  ✓ Category: ${category.name}`);
  }

  // Create default tags
  const tags = [
    { name: "UI/UX", slug: "ui-ux", color: "purple" },
    { name: "Performance", slug: "performance", color: "orange" },
    { name: "Documentation", slug: "documentation", color: "blue" },
    { name: "Wizard", slug: "wizard", color: "indigo" },
    { name: "Blueprints", slug: "blueprints", color: "cyan" },
    { name: "Billing", slug: "billing", color: "emerald" },
    { name: "Authentication", slug: "authentication", color: "rose" },
    { name: "API", slug: "api", color: "violet" },
    { name: "Mobile", slug: "mobile", color: "teal" },
    { name: "Integration", slug: "integration", color: "sky" },
  ];

  for (const tag of tags) {
    await prisma.supportTag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
    console.log(`  ✓ Tag: ${tag.name}`);
  }

  console.log("✅ Support database seeded successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });










