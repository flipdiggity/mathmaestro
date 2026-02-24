import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { WorksheetPDF, BatchWorksheetPDF } from './worksheet-template';
import { Question } from '@/types';

export async function renderWorksheetPDF(
  title: string,
  childName: string,
  questions: Question[],
  date?: string
): Promise<Buffer> {
  const element = React.createElement(WorksheetPDF, {
    title,
    childName,
    questions,
    date,
  });

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}

export async function renderBatchWorksheetPDF(
  childName: string,
  days: Array<{ title: string; questions: Question[]; date?: string }>
): Promise<Buffer> {
  const element = React.createElement(BatchWorksheetPDF, {
    childName,
    days,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
