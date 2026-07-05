import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIRST_DAY_2026 = new Date('2026-08-12T12:00:00-05:00');
const MYLO_TEST_2027 = new Date('2027-04-15T12:00:00-05:00');

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

  // Eliana — rising 6th grader taking Math 8 Accelerated (2nd half of Math 7 +
  // all of Math 8). The course preset (curriculum/courses.ts) supplies the
  // topic pool (engine grade 7 + accelerated → grade-7 + grade-8) and the
  // start floor (grade 7, order 17). Summer plan: cover it all by the first
  // day of school.
  const eliana = await prisma.child.upsert({
    where: { id: 'eliana' },
    update: {
      grade: 7,
      track: 'accelerated',
      courseId: 'eanes-m8-accel-g6',
      displayGrade: 6,
      planEndDate: FIRST_DAY_2026,
      userId: user.id,
    },
    create: {
      id: 'eliana',
      name: 'Eliana',
      grade: 7,
      track: 'accelerated',
      courseId: 'eanes-m8-accel-g6',
      displayGrade: 6,
      planEndDate: FIRST_DAY_2026,
      state: 'TX',
      district: 'eanes-isd',
      userId: user.id,
    },
  });

  // Mylo — rising 4th grader on the acceleration-test-readiness course:
  // all of grade 4 at escalating depth, then grade 5 preview, toward the
  // spring-2027 assessment that places students into compacted 5/6.
  const mylo = await prisma.child.upsert({
    where: { id: 'mylo' },
    update: {
      grade: 4,
      track: 'accelerated',
      courseId: 'eanes-g4-accel-ready',
      displayGrade: 4,
      planEndDate: FIRST_DAY_2026,
      targetTestDate: MYLO_TEST_2027,
      userId: user.id,
    },
    create: {
      id: 'mylo',
      name: 'Mylo',
      grade: 4,
      track: 'accelerated',
      courseId: 'eanes-g4-accel-ready',
      displayGrade: 4,
      planEndDate: FIRST_DAY_2026,
      targetTestDate: MYLO_TEST_2027,
      state: 'TX',
      district: 'eanes-isd',
      userId: user.id,
    },
  });

  console.log('Seeded:', { user: user.id, eliana: eliana.id, mylo: mylo.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
