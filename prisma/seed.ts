import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your environment before seeding."
    );
  }

  // Guard against shipping the example placeholder or an obviously weak secret.
  const PLACEHOLDERS = new Set([
    "ChangeThisPassword123!",
    "admin@example.com",
    "change-me",
  ]);
  if (PLACEHOLDERS.has(password) || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is the example placeholder or too short. " +
        "Set a unique password of at least 12 characters before seeding."
    );
  }
  if (PLACEHOLDERS.has(email)) {
    throw new Error(
      "SEED_ADMIN_EMAIL is still the example placeholder. Set a real admin email."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN" },
  });

  console.log(`Super admin ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
