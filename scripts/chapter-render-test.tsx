import { writeFileSync } from 'fs'; import { join } from 'path';
import { renderWorksheetPDF, TopicReviewRef } from '../src/lib/pdf/render';
import { Question } from '../src/types';
const q: Question[] = [
  { number:1, question:'Find the volume of a cylinder with radius 4 cm and height 10 cm.', answer:'502.4', topicId:'8.vl.1', topicName:'Volume of Cylinders, Cones, and Spheres', difficulty:2, isVerifiable:true, section:'new' },
  { number:2, question:'Find the total surface area of a rectangular prism 5 by 3 by 8 cm.', answer:'158', topicId:'8.vl.2', topicName:'Surface Area of Prisms and Cylinders', difficulty:2, isVerifiable:true, section:'new' },
  { number:3, question:'Evaluate: -7 + (-5).', answer:'-12', topicId:'7.ns.4', topicName:'Adding and Subtracting Rational Numbers', difficulty:1, isVerifiable:true, section:'new' },
];
const reviews: TopicReviewRef[] = [
  { topicName:'Volume of Cylinders, Cones, and Spheres', bookRefs:[{title:'x',isbn:'x',chapter:47,note:'Volume'},{title:'x',isbn:'x',chapters:[45,46],note:'3D Figures'}] },
  { topicName:'Surface Area of Prisms and Cylinders', bookRefs:[{title:'x',isbn:'x',chapter:48,note:'Surface Area'}] },
];
(async()=>{ const buf=await renderWorksheetPDF('Chapter Test','Eliana',q,'Test',reviews); const out=join(process.cwd(),'chapter-render-test.pdf'); writeFileSync(out,buf); console.log('wrote',out); })();
