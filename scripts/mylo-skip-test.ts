import { getTopicsForChild } from '../src/lib/curriculum';
import { orderedSequence, floorIndexFor, getStartFloor, seqCountsFor, selectSequential, SeqMastery } from '../src/lib/curriculum/sequencing';

const pool = getTopicsForChild(4, 'standard');
const seq = orderedSequence(pool);
const floor = floorIndexFor(seq, getStartFloor('Mylo', 4));

console.log('Grade-4 sequence (order : name):');
for (const t of seq) console.log(`  ${String(t.order).padStart(2)}  ${t.name}`);

function show(label: string, mastery: Map<string,SeqMastery>) {
  const { selections } = selectSequential(seq, mastery, { floorIndex: floor, counts: seqCountsFor(25,'steady') });
  console.log(`\n=== ${label} ===`);
  for (const s of selections) console.log(`  [${s.reason.toUpperCase().padEnd(7)}] ord${String(s.topic.order).padStart(2)}  ${s.topic.name}`);
}

show('Before skipping (stuck at start of 4th)', new Map());

// Parent marks early number-sense as known (skip) — orders 1..8ish
const known = new Map<string,SeqMastery>();
for (const t of seq) if (t.order <= 8) known.set(t.id, { mastery: 100, lastPracticedAt: new Date(), timesPracticed: 0 });
show('After marking early topics known', known);
