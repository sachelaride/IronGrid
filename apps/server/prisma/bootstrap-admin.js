const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.IRONGRID_DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.IRONGRID_DEFAULT_ADMIN_PASSWORD || 'admin';
  const name = process.env.IRONGRID_DEFAULT_ADMIN_NAME || 'Administrador IronGrid';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: UserRole.ADMIN,
      name,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
    create: {
      username,
      password: hashedPassword,
      name,
      role: UserRole.ADMIN,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
    select: { username: true, role: true },
  });

  console.log(`[BOOTSTRAP] Usuario inicial garantido: ${user.username} (${user.role})`);
}

main()
  .catch((error) => {
    console.error('[BOOTSTRAP] Falha ao garantir usuario inicial:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
