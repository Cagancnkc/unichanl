import type { ChatMessage } from '../types/index.js';

export type TaskType = 'code' | 'reasoning' | 'chat' | 'long-context' | 'creative';

export interface PromptFeatures {
  totalChars: number;
  totalWords: number;
  hasCodeBlock: boolean;
  hasInlineCode: boolean;
  codeLanguageHints: string[];
  reasoningSignals: number;
  creativeSignals: number;
  turnCount: number;
  systemHasInstructions: boolean;
  language: 'tr' | 'en' | 'unknown';
}

export interface Classification {
  taskType: TaskType;
  suggestedTags: string[];
  features: PromptFeatures;
  reason: string;
}

const CODE_FENCE = /```(\w+)?/g;
const INLINE_CODE = /`[^`\n]+`/;
const REASONING_PATTERNS = [
  /\bstep[- ]by[- ]step\b/i,
  /\banaliz\s*et\b/i,
  /\bwhy\b|\bneden\b/i,
  /\bprove\b|\bispat(la)?\b/i,
  /\breason(ing)?\b|\bçıkarım\b/i,
  /\bmath\b|\bmatematik\b/i,
  /\bcompare\b|\bkarşılaştır\b/i,
  /\bdebug\b|\bhata\s*bul\b/i,
  /\bplan(la)?\b/i,
];
const CREATIVE_PATTERNS = [
  /\bstory\b|\bhikaye\b|\böykü\b/i,
  /\bpoem\b|\bşiir\b/i,
  /\bcreative\b|\byaratıcı\b/i,
  /\bimagine\b|\bhayal\s*et\b/i,
  /\brewrite\b|\byeniden\s*yaz\b/i,
];
const TR_HINT = /[çğıöşü]|(\bve\b|\bbir\b|\biçin\b|\bile\b|\bama\b|\bnasıl\b)/i;
const EN_HINT = /\b(the|and|is|of|to|for|with|how|what|why)\b/i;

const LONG_CONTEXT_THRESHOLD = 20_000;

function detectLanguage(text: string): PromptFeatures['language'] {
  const tr = TR_HINT.test(text);
  const en = EN_HINT.test(text);
  if (tr && !en) return 'tr';
  if (en && !tr) return 'en';
  if (tr && en) return text.match(TR_HINT)!.length >= 2 ? 'tr' : 'en';
  return 'unknown';
}

function extractCodeLangs(text: string): string[] {
  const langs: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(CODE_FENCE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    if (m[1]) langs.push(m[1].toLowerCase());
  }
  return Array.from(new Set(langs));
}

export function extractFeatures(messages: ChatMessage[]): PromptFeatures {
  const joined = messages.map((m) => m.content).join('\n');
  const userAndAssistant = messages.filter((m) => m.role !== 'system');
  const systemMsgs = messages.filter((m) => m.role === 'system');

  const totalChars = joined.length;
  const totalWords = joined.split(/\s+/).filter(Boolean).length;
  const hasCodeBlock = /```/.test(joined);
  const hasInlineCode = INLINE_CODE.test(joined);
  const codeLanguageHints = extractCodeLangs(joined);
  const reasoningSignals = REASONING_PATTERNS.reduce((n, r) => n + (r.test(joined) ? 1 : 0), 0);
  const creativeSignals = CREATIVE_PATTERNS.reduce((n, r) => n + (r.test(joined) ? 1 : 0), 0);
  const turnCount = userAndAssistant.length;
  const systemHasInstructions = systemMsgs.some((m) => m.content.trim().length > 40);
  const language = detectLanguage(joined);

  return {
    totalChars,
    totalWords,
    hasCodeBlock,
    hasInlineCode,
    codeLanguageHints,
    reasoningSignals,
    creativeSignals,
    turnCount,
    systemHasInstructions,
    language,
  };
}

export function classify(messages: ChatMessage[]): Classification {
  const features = extractFeatures(messages);
  const tags = new Set<string>();
  let taskType: TaskType = 'chat';
  const why: string[] = [];

  if (features.totalChars >= LONG_CONTEXT_THRESHOLD) {
    tags.add('long-context');
    taskType = 'long-context';
    why.push(`chars=${features.totalChars}>=${LONG_CONTEXT_THRESHOLD}`);
  }

  if (features.hasCodeBlock || features.codeLanguageHints.length > 0) {
    tags.add('code');
    taskType = 'code';
    why.push(`code-block${features.codeLanguageHints.length ? `:${features.codeLanguageHints.join(',')}` : ''}`);
  } else if (features.hasInlineCode && features.totalWords < 200) {
    tags.add('code');
    why.push('inline-code');
  }

  if (features.reasoningSignals >= 2) {
    tags.add('reasoning');
    if (taskType === 'chat') taskType = 'reasoning';
    why.push(`reasoning-signals=${features.reasoningSignals}`);
  }

  if (features.creativeSignals >= 1 && !tags.has('code') && !tags.has('reasoning')) {
    taskType = 'creative';
    why.push(`creative-signals=${features.creativeSignals}`);
  }

  if (features.totalWords < 40 && !tags.has('code') && !tags.has('reasoning')) {
    tags.add('fast');
    tags.add('cheap');
    why.push(`short-prompt=${features.totalWords}w`);
  }

  return {
    taskType,
    suggestedTags: Array.from(tags),
    features,
    reason: why.length > 0 ? why.join('; ') : 'default:chat',
  };
}
