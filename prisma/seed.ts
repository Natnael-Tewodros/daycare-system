import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@daycare.com";
  const id = process.env.ADMIN_ID || "admin";
  const name = process.env.ADMIN_NAME || "Admin User";
  const rawPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const password = await bcrypt.hash(rawPassword, 10);

  await prisma.user.upsert({
    where: { id },
    update: {
      name,
      email,
      password,
      role: UserRole.ADMIN,
    },
    create: {
      id,
      name,
      email,
      password,
      role: UserRole.ADMIN,
    },
  });

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
