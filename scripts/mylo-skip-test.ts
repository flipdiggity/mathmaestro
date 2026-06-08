import { getTopicsForChild } from '../src/lib/curriculum';
import { orderedSequence, floorIndexFor, getStartFloor, seqCountsFor, selectSequential, SeqMastery } from '../src/lib/curriculum/sequencing';
const pool = getTopicsForChild(4, 'accelerated');
const seq = orderedSequence(pool);
const floor = floorIndexFor(seq, getStartFloor('Mylo', 4));
const m = new Map<string,SeqMastery>();
// 4.nbt.1..6 manually skipped (mastery 100, timesPracticed 0):
for (const t of seq) if (/^4\.nbt\.[1-6]$/.test(t.id)) m.set(t.id,{mastery:100,lastPracticedAt:new Date(),timesPracticed:0});
// one GRADED-mastered topic (can still maintenance):
m.set('4.nbt.7',{mastery:90,lastPracticedAt:new Date(Date.now()-10*86400000),timesPracticed:3});
const { selections } = selectSequential(seq, m, { floorIndex: floor, counts: seqCountsFor(25,'steady') });
console.log('Mylo selection (skips on 4.nbt.1-6):');
for (const s of selections) console.log(`  [${s.reason.toUpperCase().padEnd(7)}] ${s.topic.id.padEnd(8)} ${s.topic.name}`);
const skipped = selections.filter(s=>/^4\.nbt\.[1-6]$/.test(s.topic.id));
console.log(skipped.length===0 ? 'PASS: no manually-skipped topic appears' : 'FAIL: skipped topic leaked: '+skipped.map(s=>s.topic.id));
