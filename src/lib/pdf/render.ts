import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { WorksheetPDF } from './worksheet-template';
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
