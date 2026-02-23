import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists (unique is email+role)
  const existingAdmin = await prisma.user.findUnique({
    where: { email_role: { email: 'admin@ihis.com', role: UserRole.ADMIN } },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ihis.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Default admin user created!');
  console.log('📧 Email: admin@ihis.com');
  console.log('🔑 Password: admin123');
  console.log('⚠️  Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



