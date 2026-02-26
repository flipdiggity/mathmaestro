import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a dev user
  const devUser = await prisma.user.upsert({
    where: { clerkId: 'dev_user' },
    update: {},
    create: {
      id: 'dev-user',
      clerkId: 'dev_user',
      email: 'dev@sharpsheet.com',
      name: 'Dev User',
    },
  });

  // Eliana - 5th grade, targeting Math 8 Accelerated placement test May 2026
  const eliana = await prisma.child.upsert({
    where: { id: 'eliana' },
    update: { userId: devUser.id },
    create: {
      id: 'eliana',
      name: 'Eliana',
      grade: 5,
      track: 'accelerated',
      state: 'TX',
      district: 'eanes-isd',
      targetTestDate: new Date('2026-05-15'),
      userId: devUser.id,
    },
  });

  // Mylo - 3rd grade, preparing for accelerated 4th grade
  const mylo = await prisma.child.upsert({
    where: { id: 'mylo' },
    update: { userId: devUser.id },
    create: {
      id: 'mylo',
      name: 'Mylo',
      grade: 3,
      track: 'accelerated',
      state: 'TX',
      district: 'eanes-isd',
      targetTestDate: new Date('2026-05-15'),
      userId: devUser.id,
    },
  });

  console.log('Seeded:', { devUser, eliana, mylo });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
