import 'onnxruntime-node';
import { Logger } from '@nestjs/common';
import { Gliner } from 'gliner/node';
import { RedactionItemType } from '../dto/redacted.dto';

// Keep these labels aligned with the redaction schema in the prompt builder.
export const ENTITY_TAG_MAP: Record<string, string> = {
  name: '<NAME>',
  person: '<NAME>',
  business_name: '<BUSINESS_NAME>',
  organization: '<BUSINESS_NAME>',
  email: '<EMAIL>',
  phone: '<PHONE>',
  'phone number': '<PHONE>',
  address: '<ADDRESS>',
  id_number: '<ID_NUMBER>',
  'credit card': '<ID_NUMBER>',
  other: '<OTHER>',
};

let glinerInitialization: Promise<Gliner> | null = null;
const logger = new Logger('GlinerFilter');

/**
 * Initializes GLiNER once on startup.
 */
export function initGliner(): Promise<Gliner> {
  if (glinerInitialization === null) {
    logger.log('Starting GLiNER initialization');
    glinerInitialization = initializeGliner()
      .then((instance) => {
        logger.log('GLiNER initialization completed');
        return instance;
      })
      .catch((error: unknown) => {
        glinerInitialization = null;
        logger.error(
          `GLiNER initialization failed: ${describeError(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw error;
      });
  }

  return glinerInitialization;
}

async function initializeGliner(): Promise<Gliner> {
  const modelPath = process.env.GLINER_MODEL_PATH;
  if (!modelPath) {
    throw new Error(
      'GLINER_MODEL_PATH must point to the local GLiNER ONNX model',
    );
  }

  const glinerInstance = new Gliner({
    tokenizerPath:
      process.env.GLINER_TOKENIZER_PATH ?? 'onnx-community/gliner_small-v2',
    onnxSettings: { modelPath },
    transformersSettings: {
      allowLocalModels: true,
      useBrowserCache: false,
    },
  });
  logger.log(
    `Initializing GLiNER with model ${modelPath} and tokenizer ${
      process.env.GLINER_TOKENIZER_PATH ?? 'onnx-community/gliner_small-v2'
    }`,
  );
  await glinerInstance.initialize();
  return glinerInstance;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return JSON.stringify(error) ?? `Unknown ${typeof error} error`;
}

export interface RedactionItem {
  word: string;
  tag: string;
}

export interface RedactedText {
  redactedText: string;
  items: Array<{
    text: string;
    type: RedactionItemType;
  }>;
}

const TAG_TO_REDACTION_TYPE: Record<string, RedactionItemType> = {
  '<NAME>': RedactionItemType.NAME,
  '<BUSINESS_NAME>': RedactionItemType.BUSINESS_NAME,
  '<EMAIL>': RedactionItemType.EMAIL,
  '<PHONE>': RedactionItemType.PHONE,
  '<ADDRESS>': RedactionItemType.ADDRESS,
  '<ID_NUMBER>': RedactionItemType.ID_NUMBER,
  '<OTHER>': RedactionItemType.OTHER,
};

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/g;

/**
 * Extracts sensitive entities and formats them as word/tag pairs.
 */
export async function detectSensitiveWords(
  text: string,
): Promise<RedactionItem[]> {
  if (!text || !text.trim()) return [];

  const model = await initGliner();

  const labels = Object.keys(ENTITY_TAG_MAP);

  let entities: Awaited<ReturnType<Gliner['inference']>>[0];
  try {
    [entities] = await model.inference({
      texts: [text],
      entities: labels,
      threshold: 0.4,
      flatNer: true,
    });
  } catch (error) {
    logger.error(
      `GLiNER inference failed: ${describeError(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw error;
  }

  const results: RedactionItem[] = [];
  const seenWords = new Set<string>();

  for (const entity of entities) {
    const word = entity.spanText;
    if (!word || !word.trim()) continue;

    const label = entity.label.toLowerCase();
    const tag =
      ENTITY_TAG_MAP[label] || `<${label.toUpperCase().replace(/\s+/g, '_')}>`;

    if (!seenWords.has(word)) {
      seenWords.add(word);
      results.push({ word, tag });
    }
  }

  return results;
}

/**
 * Replaces detected sensitive values with typed, numbered placeholders.
 */
export async function redactSensitiveText(text: string): Promise<RedactedText> {
  if (!text.trim()) {
    return { redactedText: text, items: [] };
  }

  const detected = await detectSensitiveWords(text);
  const items = detected.map(({ word, tag }) => ({
    text: word,
    type: TAG_TO_REDACTION_TYPE[tag] || RedactionItemType.OTHER,
  }));
  const seen = new Set(items.map((item) => item.text));

  for (const match of text.match(EMAIL_RE) ?? []) {
    if (!seen.has(match)) {
      items.push({ text: match, type: RedactionItemType.EMAIL });
      seen.add(match);
    }
  }
  for (const match of text.match(PHONE_RE) ?? []) {
    if (!seen.has(match)) {
      items.push({ text: match, type: RedactionItemType.PHONE });
      seen.add(match);
    }
  }

  const verified = items
    .filter((item) => item.text.trim() && text.includes(item.text))
    .sort((a, b) => b.text.length - a.text.length);

  let redactedText = text;
  const counters: Partial<Record<RedactionItemType, number>> = {};
  const redactedItems: RedactedText['items'] = [];

  for (const item of verified) {
    if (!redactedText.includes(item.text)) continue;

    const count = (counters[item.type] ?? 0) + 1;
    counters[item.type] = count;
    const token = `[${item.type.toUpperCase()}_${count}]`;

    redactedText = redactedText.split(item.text).join(token);
    redactedItems.push(item);
  }

  return { redactedText, items: redactedItems };
}
