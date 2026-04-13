import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const SETTINGS_ID = "singleton";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@giuseppe.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@giuseppe.com",
      password,
      role: Role.ADMIN,
    },
  });

  const freddie = await prisma.user.upsert({
  where: { email: "freddie_moala@hotmail.com" },
  update: {},
  create: {
    name: "Freddie",
    email: "freddie_moala@hotmail.com",
    password: await bcrypt.hash("Wolverin123", 10),
    role: Role.ADMIN, // or MANAGER / STAFF
  },
});


  const manager = await prisma.user.upsert({
    where: { email: "manager@giuseppe.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@giuseppe.com",
      password,
      role: Role.MANAGER,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@giuseppe.com" },
    update: {},
    create: {
      name: "Staff User",
      email: "staff@giuseppe.com",
      password,
      role: Role.STAFF,
    },
  });

  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: {
      id: SETTINGS_ID,
      siteName: "Giuseppe's Restaurant",
      defaultEmail: null,
    },
  });

  console.log("Seeded users:");
  console.log(`  ADMIN   - admin@giuseppe.com   / password123`);
  console.log(`  MANAGER - manager@giuseppe.com / password123`);
  console.log(`  STAFF   - staff@giuseppe.com   / password123`);
  console.log("Seeded default settings (no email configured).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
