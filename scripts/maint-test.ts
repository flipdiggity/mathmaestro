import { selectSequential, SeqMastery } from '../src/lib/curriculum/sequencing';
import { CurriculumTopic } from '../src/lib/curriculum/types';
const mk=(id:string,order:number):CurriculumTopic=>({id,tpiCode:id,name:id,description:'',gradeLevel:4,strand:'',difficulty:1,prerequisites:[],sampleProblems:[],isVerifiable:true,order,nineWeeks:1});
const seq=[mk('a',1),mk('b',2),mk('c',3),mk('d',4),mk('e',5),mk('f',6)];
const counts={numCurrent:3,numReview:2,numPreview:1};
function run(label:string, tp:number, mastery:number, days:number){
  const m=new Map<string,SeqMastery>();
  // a,b,c mastered graded -> frontier at d; 'a' is the maintenance candidate
  m.set('a',{mastery,timesPracticed:tp,lastPracticedAt:new Date(Date.now()-days*86400000)});
  m.set('b',{mastery:90,timesPracticed:2,lastPracticedAt:new Date()});
  m.set('c',{mastery:90,timesPracticed:2,lastPracticedAt:new Date()});
  const {selections}=selectSequential(seq,m,{floorIndex:0,counts});
  const aShown=selections.some(s=>s.topic.id==='a');
  console.log(`${label}: 'a' (mastery${mastery}, times${tp}, ${days}d ago) -> ${aShown?'SHOWN (maintenance)':'not shown'}`);
}
run('fresh master, long gap', 1, 90, 5);     // interval 1d, 5d>=1 -> shown
run('practiced 4x, 5d gap', 4, 90, 5);        // interval 8d, 5d<8 -> not yet
run('practiced 4x, 20d gap', 4, 90, 20);      // interval 8d, 20>=8 -> shown
run('rock solid 95%/4x', 4, 96, 60);          // hard stop -> never
