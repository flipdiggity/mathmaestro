import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Local user for the personal-use rebuild — matches LOCAL_USER in src/lib/auth.ts.
  const user = await prisma.user.upsert({
    where: { id: 'local-felipe' },
    update: {},
    create: {
      id: 'local-felipe',
      clerkId: 'local-felipe',
      email: 'felipe@local',
      name: 'Felipe',
    },
  });

  // Eliana — entering 6th grade. Qualified for Math 7/8 Compacted equivalent
  // (Eanes accelerated track that covers all of Math 7 + all of Math 8 in
  // one year). Setting grade: 7 + track: 'accelerated' pulls grade-7 +
  // grade-8 topics via acceleratedMapping. Note: grade-8 currently uses
  // grade-8-accel-prep.ts which is actually all Math 7 content — Day 2
  // task is to write a real grade-8.ts.
  const eliana = await prisma.child.upsert({
    where: { id: 'eliana' },
    update: {
      grade: 7,
      track: 'accelerated',
      targetTestDate: null,
      userId: user.id,
    },
    create: {
      id: 'eliana',
      name: 'Eliana',
      grade: 7,
      track: 'accelerated',
      state: 'TX',
      district: 'eanes-isd',
      userId: user.id,
    },
  });

  // Mylo — entering 4th grade. Standard track for now; flip to 'accelerated'
  // once grade-5.ts is written in Day 2 (acceleratedMapping[4] = [5]).
  const mylo = await prisma.child.upsert({
    where: { id: 'mylo' },
    update: {
      grade: 4,
      track: 'standard',
      targetTestDate: null,
      userId: user.id,
    },
    create: {
      id: 'mylo',
      name: 'Mylo',
      grade: 4,
      track: 'standard',
      state: 'TX',
      district: 'eanes-isd',
      userId: user.id,
    },
  });

  console.log('Seeded:', { user, eliana, mylo });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
