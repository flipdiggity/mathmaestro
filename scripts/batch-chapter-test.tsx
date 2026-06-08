import { writeFileSync } from 'fs';
import { renderBatchWorksheetPDF, TopicReviewRef } from '../src/lib/pdf/render';
import { Question } from '../src/types';
// Question topicName DRIFTS from the curriculum name, but topicId matches:
const questions: Question[] = [
  { number:1, question:'Find the slope through (2,7) and (6,-1).', answer:'-2', topicId:'7.lr.2', topicName:'Slope (rate of change)', difficulty:2, isVerifiable:true, section:'new' },
];
const reviews: TopicReviewRef[] = [
  { topicId:'7.lr.2', topicName:'Slope and Rate of Change', bookRefs:[{title:'x',isbn:'x',chapter:57,note:'Slope'}] },
];
(async()=>{
  const batch = await renderBatchWorksheetPDF('Eliana',[{title:'Monday',questions,date:'Mon',topicReviews:reviews}]);
  writeFileSync('/sessions/busy-compassionate-goodall/mnt/outputs/t-batch2.pdf', batch);
  console.log('rendered');
})();
