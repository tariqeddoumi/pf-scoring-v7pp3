import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL");
  const password = requireEnv("ADMIN_PASSWORD");
  const nom = process.env.ADMIN_LAST_NAME ?? "Administrateur";
  const prenom = process.env.ADMIN_FIRST_NAME ?? "Technique";
  const role = (process.env.ADMIN_ROLE ?? "ADMIN_TECH") as UserRole;

  if (password.length < 14) {
    throw new Error("ADMIN_PASSWORD must contain at least 14 characters");
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`✓ User ${email} already exists`);
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role,
      },
    });

    console.log("✓ Admin user created:");
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log("  Password was read from ADMIN_PASSWORD and was not logged.");
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
