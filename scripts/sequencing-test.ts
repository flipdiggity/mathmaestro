import { getTopicsForChild } from '../src/lib/curriculum';
import { orderedSequence, floorIndexFor, getStartFloor, seqCountsFor, selectSequential, SeqMastery } from '../src/lib/curriculum/sequencing';

function run(label: string, name: string, grade: number, track: string, mastery: Map<string,SeqMastery>) {
  const pool = getTopicsForChild(grade, track, 'TX', 'eanes-isd');
  const seq = orderedSequence(pool);
  const floor = floorIndexFor(seq, getStartFloor(name, grade));
  const counts = seqCountsFor(30, 'steady');
  const { selections } = selectSequential(seq, mastery, { floorIndex: floor, counts });
  console.log(`\n=== ${label} (floorIndex=${floor}, ${seq[floor]?.gradeLevel}.${seq[floor]?.order} ${seq[floor]?.name}) ===`);
  for (const s of selections) console.log(`  [${s.reason.toUpperCase().padEnd(7)}] g${s.topic.gradeLevel} ord${String(s.topic.order).padStart(2)}  ${s.topic.name}`);
}

// Eliana cold start: diagnostic mastery on mid-7 (signed-rational weak)
const elianaDiag = new Map<string,SeqMastery>([
  ['7.ns.2',{mastery:88,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
  ['7.ns.3',{mastery:82,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
  ['7.ns.4',{mastery:55,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}], // her gap
  ['7.ns.5',{mastery:60,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
  ['7.pr.1',{mastery:90,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
  ['7.ee.1',{mastery:78,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
]);
run('Eliana — start (2nd half 7th + mid-7 review)', 'Eliana', 7, 'accelerated', elianaDiag);

// Eliana advanced: all grade-7 mastered -> should enter grade 8
const elianaAdv = new Map<string,SeqMastery>();
for (const t of getTopicsForChild(7,'accelerated')) if (t.gradeLevel===7) elianaAdv.set(t.id,{mastery:90,lastPracticedAt:new Date(),timesPracticed:2});
run('Eliana — all 7th mastered (enters 8th)', 'Eliana', 7, 'accelerated', elianaAdv);

// Mylo cold start grade 4
run('Mylo — start of 4th', 'Mylo', 4, 'standard', new Map());
