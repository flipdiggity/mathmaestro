/**
 * Reset a child (or the seeded kids) to a clean slate: clear all learned-state
 * so the frontier returns to their course's starting point. Use after the
 * "raced ahead" bug, or when re-placing a child via the diagnostic.
 *
 * Clears: TopicMastery (mastery, serve counts, difficulty ladder, miss memory)
 *   and — with --worksheets — the raced-ahead worksheets + their grading rows.
 * Keeps:  the Child row (course, plan, grade) untouched.
 *
 * Run: npx tsx scripts/reset-child-progress.ts eliana mylo --worksheets
 */
import { prisma } from '../src/lib/db';
import { resolveCurriculumForChild } from '../src/lib/curriculum/courses';

async function resetChild(childId: string, clearWorksheets: boolean) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) {
    console.log(`  ! ${childId}: not found, skipping`);
    return;
  }

  const masteryDeleted = await prisma.topicMastery.deleteMany({ where: { childId } });

  let wsDeleted = 0;
  let gradesDeleted = 0;
  if (clearWorksheets) {
    const ws = await prisma.worksheet.findMany({ where: { childId }, select: { id: true } });
    const ids = ws.map((w) => w.id);
    if (ids.length) {
      const g = await prisma.gradingResult.deleteMany({ where: { worksheetId: { in: ids } } });
      gradesDeleted = g.count;
      const w = await prisma.worksheet.deleteMany({ where: { childId } });
      wsDeleted = w.count;
    }
  }

  // Report where the frontier now sits (the first topic they'll practice).
  const { seq, floorIndex, course } = resolveCurriculumForChild(child);
  const startTopic = seq[floorIndex];
  console.log(
    `  ✓ ${child.name} (${childId}): cleared ${masteryDeleted.count} mastery rows` +
      (clearWorksheets ? `, ${wsDeleted} worksheets, ${gradesDeleted} grades` : '') +
      `\n     course: ${course?.label ?? `${child.grade}/${child.track}`}` +
      `\n     now starts at: ${startTopic ? `${startTopic.name} (grade ${startTopic.gradeLevel}, order ${startTopic.order})` : 'unknown'}`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const clearWorksheets = args.includes('--worksheets');
  const ids = args.filter((a) => !a.startsWith('--'));
  const childIds = ids.length ? ids : ['eliana', 'mylo'];

  console.log(`Resetting: ${childIds.join(', ')}${clearWorksheets ? ' (+ worksheets)' : ''}\n`);
  for (const id of childIds) await resetChild(id, clearWorksheets);
  console.log('\nDone. Each child now starts at their course floor and advances ONLY as');
  console.log('sheets are photo-graded to mastery. Run the diagnostic on /generate to place');
  console.log('them more precisely (optional), or mark known topics on /plan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
