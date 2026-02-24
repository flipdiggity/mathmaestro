import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Eliana - 5th grade, targeting Math 8 Accelerated placement test May 2026
  const eliana = await prisma.child.upsert({
    where: { id: 'eliana' },
    update: {},
    create: {
      id: 'eliana',
      name: 'Eliana',
      grade: 5,
      track: 'accelerated',
      targetTestDate: new Date('2026-05-15'),
    },
  });

  // Mylo - 3rd grade, preparing for accelerated 4th grade
  const mylo = await prisma.child.upsert({
    where: { id: 'mylo' },
    update: {},
    create: {
      id: 'mylo',
      name: 'Mylo',
      grade: 3,
      track: 'accelerated',
      targetTestDate: new Date('2026-05-15'),
    },
  });

  console.log('Seeded children:', { eliana, mylo });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
