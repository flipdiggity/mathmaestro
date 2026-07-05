import { getTopicsForChild } from '../src/lib/curriculum';
import { orderedSequence, floorIndexFor, getStartFloor, seqCountsFor, selectSequential, SeqMastery } from '../src/lib/curriculum/sequencing';
import { buildGeneratePrompt, contextsFromSelections } from '../src/lib/prompts/generate-worksheet';

const pool = getTopicsForChild(7, 'accelerated');
const seq = orderedSequence(pool);
const floor = floorIndexFor(seq, getStartFloor('Eliana', 7));
// mastery: weak on signed-rational (a gap), strong on proportions/like-terms
const mastery = new Map<string,SeqMastery>([
  ['7.ns.4',{mastery:45,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}], // weak -> easier
  ['7.ns.5',{mastery:50,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:1}],
  ['7.pr.1',{mastery:92,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:2}], // mastered -> harder
  ['7.ee.1',{mastery:88,lastPracticedAt:new Date(Date.now()-2*86400000),timesPracticed:2}],
]);
const { selections } = selectSequential(seq, mastery, { floorIndex: floor, counts: seqCountsFor(30,'steady') });
const { prompt } = buildGeneratePrompt('Eliana', 7, contextsFromSelections(selections, 30), 30);
// print the per-topic TARGET lines
for (const line of prompt.split('\n')) {
  if (/GENERATE \d+ question/.test(line)) console.log(line.trim());
}
