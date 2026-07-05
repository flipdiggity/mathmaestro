import Anthropic from '@anthropic-ai/sdk';

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAnthropic.anthropic ||
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

if (process.env.NODE_ENV !== 'production') globalForAnthropic.anthropic = anthropic;

// Generation + vision-grading model. Sonnet 5 measurably improves problem
// quality, figure-JSON adherence, and handwriting grading over Sonnet 4.6.
// Override with ANTHROPIC_MODEL to pin/rollback without a code change.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Reasoning effort: 'medium' on Sonnet 5 matches the previous model's 'high'
// quality at a fraction of the latency (a 25-question sheet drops from ~4min
// to well under 2). Raise via env if quality ever needs it.
const EFFORT = (process.env.ANTHROPIC_EFFORT || 'medium') as
  | 'low'
  | 'medium'
  | 'high'
  | 'max';

// Claude 5-family notes:
//  • `temperature` is rejected ("deprecated for this model") — we don't send it;
//    variety comes from the prompt's freshness/rotation directives. The retry
//    below is a safety net for ANTHROPIC_MODEL overrides.
//  • Adaptive thinking is ON by default and counts against max_tokens — that's
//    a feature (the model double-checks its arithmetic before writing the
//    answer key), so budgets are sized for thinking + text and we read the
//    TEXT block, never content[0] (which may be a thinking block).
//  • We stream and collect the final message: the SDK requires streaming for
//    large max_tokens, and it avoids serverless response timeouts.
async function createMessage(
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Anthropic.Message> {
  try {
    return await anthropic.messages.stream(params).finalMessage();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if ('temperature' in params && /temperature.*deprecated/i.test(msg)) {
      const { temperature: _unused, ...rest } = params;
      void _unused;
      return await anthropic.messages.stream(rest).finalMessage();
    }
    throw e;
  }
}

export async function generateText(
  prompt: string,
  options: {
    system?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { system, maxTokens = 4096 } = options;

  const response = await createMessage({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: EFFORT },
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: prompt }],
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text block in model response');
  return block.text;
}

export async function gradeWithVision(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  prompt: string,
  options: {
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { system, maxTokens = 4096 } = options;

  const response = await createMessage({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: EFFORT },
    ...(system ? { system } : {}),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text block in model response');
  return block.text;
}

export async function gradeWithMultipleImages(
  images: { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }[],
  prompt: string,
  options: {
    system?: string;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const { system, maxTokens = 4096 } = options;

  const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
    ...images.map(
      (img) =>
        ({
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: img.mediaType,
            data: img.base64,
          },
        })
    ),
    { type: 'text', text: prompt },
  ];

  const response = await createMessage({
    model: MODEL,
    max_tokens: maxTokens,
    output_config: { effort: EFFORT },
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content }],
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('No text block in model response');
  return block.text;
}
