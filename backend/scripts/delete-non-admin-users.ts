import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const nonAdmins = await prisma.user.findMany({
    where: { role: { not: UserRole.ADMIN } },
    select: { id: true, email: true, role: true },
  });

  if (nonAdmins.length === 0) {
    console.log('No non-admin users to delete.');
    return;
  }

  const ids = nonAdmins.map((u) => u.id);

  const doctors = await prisma.doctor.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const nurses = await prisma.nurse.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const patients = await prisma.patient.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const doctorIds = doctors.map((d) => d.id);
  const nurseIds = nurses.map((n) => n.id);
  const patientIds = patients.map((p) => p.id);

  console.log(`Found ${nonAdmins.length} non-admin user(s) to remove.`);

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { userId: { in: ids } } });
    await tx.task.deleteMany({
      where: { OR: [{ assignedTo: { in: ids } }, { assignedBy: { in: ids } }] },
    });
    await tx.visitNote.deleteMany({ where: { doctorId: { in: doctorIds } } });
    await tx.prescription.deleteMany({ where: { doctorId: { in: ids } } });
    await tx.nursingNote.deleteMany({ where: { nurseId: { in: ids } } });
    await tx.patientQueue.deleteMany({ where: { doctorId: { in: ids } } });
    await tx.bedAssignment.deleteMany({
      where: {
        OR: [
          { doctorId: { in: doctorIds } },
          { nurseId: { in: nurseIds } },
          { patientId: { in: patientIds } },
        ],
      },
    });
    const deleted = await tx.user.deleteMany({
      where: { role: { not: UserRole.ADMIN } },
    });
    console.log(`Deleted ${deleted.count} user(s). Admin users kept.`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
