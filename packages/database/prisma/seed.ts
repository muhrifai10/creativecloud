import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@nexusdrive.test';
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Pengguna Demo',
      passwordHash,
      profile: { create: { email, fullName: 'Pengguna Demo' } },
    },
  });

  console.log(`Seed selesai. User: ${user.email} (password: Password123!)`);
}

main().finally(() => prisma.$disconnect());
