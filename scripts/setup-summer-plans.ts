/**
 * One-time setup: put Eliana and Mylo on their real courses + summer plans.
 * Run AFTER `npm run db:push` has applied the courseId/displayGrade/planEndDate
 * columns:  npx tsx scripts/setup-summer-plans.ts
 *
 * Eliana — rising 6th grader taking Math 8 Accelerated (2nd half of Math 7 +
 *   all of Math 8). Goal: cover the whole sequence by the first day of school.
 * Mylo — rising 4th grader on the acceleration-test-readiness course (all of
 *   grade 4 at escalating depth, then grade 5 preview). Summer plan paces him
 *   through grade 4; the actual acceleration test is spring 2027.
 */
import { prisma } from '../src/lib/db';

const FIRST_DAY_2026 = new Date('2026-08-12T12:00:00-05:00');
const MYLO_TEST_2027 = new Date('2027-04-15T12:00:00-05:00');

async function main() {
  const eliana = await prisma.child.update({
    where: { id: 'eliana' },
    data: {
      courseId: 'eanes-m8-accel-g6',
      displayGrade: 6,
      planEndDate: FIRST_DAY_2026,
      // engine fields stay: grade 7 + accelerated → grade-7+grade-8 pool
    },
  });
  console.log(
    `Eliana → course=${eliana.courseId} displayGrade=${eliana.displayGrade} planEnd=${eliana.planEndDate?.toISOString().slice(0, 10)}`
  );

  const mylo = await prisma.child.update({
    where: { id: 'mylo' },
    data: {
      courseId: 'eanes-g4-accel-ready',
      displayGrade: 4,
      planEndDate: FIRST_DAY_2026,
      targetTestDate: MYLO_TEST_2027,
    },
  });
  console.log(
    `Mylo → course=${mylo.courseId} displayGrade=${mylo.displayGrade} planEnd=${mylo.planEndDate?.toISOString().slice(0, 10)} testDate=${mylo.targetTestDate?.toISOString().slice(0, 10)}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
