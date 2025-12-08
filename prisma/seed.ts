import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@daycare.com";
  const id = process.env.ADMIN_ID || "admin";
  const username = process.env.ADMIN_USERNAME || id;
  const name = process.env.ADMIN_NAME || "Admin User";
  const rawPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { id },
    update: {
      name,
      email,
      username,
      password,
      role: UserRole.ADMIN,
    },
    create: {
      id,
      name,
      email,
      username,
      password,
      role: UserRole.ADMIN,
    },
  });

  // Ensure at least one organization and site exist so dropdowns are populated
  // Ensure core organizations exist
  const organizationNames = [
    "INSA",
    "AI",
    "MINISTRY_OF_PEACE",
    "FINANCE_SECURITY",
  ];

  for (const name of organizationNames) {
    const existing = await prisma.organization.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!existing) {
      await prisma.organization.create({
        data: {
          name,
          address: "Addis Ababa",
          phone: "000-000-0000",
          email: `${name.toLowerCase()}@daycare.com`,
        },
      });
      console.log(`Created organization '${name}'.`);
    }
  }

  // Ensure site options exist globally (sites are not linked to org in schema)
  const siteNames = ["Head Office", "Operation"];
  for (const name of siteNames) {
    const existingSite = await prisma.site.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
    if (!existingSite) {
      await prisma.site.create({
        data: {
          name,
          address: "Main Campus",
          phone: "000-000-0001",
          email: `${name.toLowerCase().replace(/\s+/g, "")}@daycare.com`,
        },
      });
      console.log(`Created site '${name}'.`);
    }
  }

  console.log(`Seeded core organizations and sites.`);
  console.log(`Admin user ensured: ${email} (id: ${id})`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
