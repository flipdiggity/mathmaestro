import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { WorksheetPDF, BatchWorksheetPDF } from './worksheet-template';
import { Question } from '@/types';
import { BookRef } from '@/lib/curriculum/types';

// Topic + book-chapter references rendered in the "Before you start" review block.
export interface TopicReviewRef {
  topicName: string;
  bookRefs?: BookRef[];
}

export async function renderWorksheetPDF(
  title: string,
  childName: string,
  questions: Question[],
  date?: string,
  topicReviews?: TopicReviewRef[]
): Promise<Buffer> {
  const element = React.createElement(WorksheetPDF, {
    title,
    childName,
    questions,
    date,
    topicReviews,
  });

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

export async function renderBatchWorksheetPDF(
  childName: string,
  days: Array<{
    title: string;
    questions: Question[];
    date?: string;
    topicReviews?: TopicReviewRef[];
  }>
): Promise<Buffer> {
  const element = React.createElement(BatchWorksheetPDF, {
    childName,
    days,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
