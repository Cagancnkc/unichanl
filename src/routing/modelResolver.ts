import type { ChatCompletionRequest, RoutingContext, RoutingStrategy } from '../types/index.js';

const STRATEGY_KEYWORDS: Record<string, RoutingStrategy> = {
  auto: 'auto',
  otomatik: 'auto',
  cheapest: 'cheapest',
  ucuz: 'cheapest',
  'en-ucuz': 'cheapest',
  fastest: 'fastest',
  hizli: 'fastest',
  'en-hizli': 'fastest',
  best: 'priority',
  priority: 'priority',
  oncelik: 'priority',
};

const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  coding: ['coding'],
  kod: ['coding'],
  reasoning: ['reasoning'],
  mantik: ['reasoning'],
  dusunme: ['reasoning'],
  fast: ['fast'],
  cheap: ['cheap'],
  'long-context': ['long_context'],
  'uzun-baglam': ['long_context'],
};

export function resolveRoutingContext(request: ChatCompletionRequest, userId: string): RoutingContext {
  const modelField = request.model.toLowerCase().trim();

  const strategy = STRATEGY_KEYWORDS[modelField];
  if (strategy) {
    return {
      requestedModel: modelField,
      strategy,
      userId,
      sessionId: request.session_id,
    };
  }

  const capabilities = CAPABILITY_KEYWORDS[modelField];
  if (capabilities) {
    return {
      requestedModel: modelField,
      strategy: 'capability',
      capabilities,
      userId,
      sessionId: request.session_id,
    };
  }

  if (request.routing_strategy) {
    return {
      requestedModel: modelField,
      strategy: request.routing_strategy,
      userId,
      sessionId: request.session_id,
    };
  }

  // Direkt model ismi (örn. "openai/gpt-4o") — capability ile eşleştirmeye çalış
  const tagsFromName = extractTagsFromModelName(modelField);
  if (tagsFromName.length > 0) {
    return {
      requestedModel: modelField,
      strategy: 'capability',
      capabilities: tagsFromName,
      userId,
      sessionId: request.session_id,
    };
  }

  return {
    requestedModel: modelField,
    strategy: 'auto',
    userId,
    sessionId: request.session_id,
  };
}

function extractTagsFromModelName(model: string): string[] {
  const tags: string[] = [];
  if (model.includes('mini') || model.includes('flash') || model.includes('haiku') || model.includes('8b')) {
    tags.push('fast', 'cheap');
  }
  if (model.includes('coding') || model.includes('code')) tags.push('coding');
  if (model.includes('reasoning') || model.includes('think')) tags.push('reasoning');
  return tags;
}
