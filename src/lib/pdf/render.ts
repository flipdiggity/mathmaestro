import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import QRCode from 'qrcode';
import { WorksheetPDF, BatchWorksheetPDF, WatchBlock } from './worksheet-template';
import { Question } from '@/types';
import { BookRef } from '@/lib/curriculum/types';

// Topic + book-chapter references shown under each question. Matched to questions
// by topicId (reliable) with topicName as a fallback.
export interface TopicReviewRef {
  topicId?: string;
  topicName: string;
  bookRefs?: BookRef[];
}

export type { WatchBlock } from './worksheet-template';

/** Video links + QR payload for the printed "Watch first" box. */
export interface WatchInput {
  url: string; // the /watch/<worksheetId> page the QR points to
  videos: Array<{ topicName: string; title: string; minutes?: number }>;
}

async function buildWatchBlock(watch?: WatchInput): Promise<WatchBlock | undefined> {
  if (!watch) return undefined;
  let qrDataUrl: string | undefined;
  try {
    // Pure black on white with a FULL 4-module quiet zone (Apple's scanner
    // guidance) — phone cameras routinely fail on tinted, cramped, or small
    // QR codes. Print size is set in worksheet-template.tsx (≥1.5 inches).
    qrDataUrl = await QRCode.toDataURL(watch.url, {
      errorCorrectionLevel: 'M',
      margin: 4,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (e) {
    console.error('QR generation failed:', e);
  }
  return { qrDataUrl, url: watch.url, videos: watch.videos };
}

export async function renderWorksheetPDF(
  title: string,
  childName: string,
  questions: Question[],
  date?: string,
  topicReviews?: TopicReviewRef[],
  watch?: WatchInput
): Promise<Buffer> {
  const element = React.createElement(WorksheetPDF, {
    title,
    childName,
    questions,
    date,
    topicReviews,
    watch: await buildWatchBlock(watch),
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
    watch?: WatchInput;
  }>
): Promise<Buffer> {
  const resolvedDays = await Promise.all(
    days.map(async (d) => ({
      ...d,
      watch: await buildWatchBlock(d.watch),
    }))
  );
  const element = React.createElement(BatchWorksheetPDF, {
    childName,
    days: resolvedDays,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}
