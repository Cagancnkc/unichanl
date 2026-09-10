import { logger } from '../../utils/logger.js';

const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';
const FETCH_TIMEOUT_MS = 20_000;

export interface UpstreamModel {
  providerName: 'openrouter' | 'nvidia';
  modelName: string;
  displayName: string;
  description: string | null;
  contextWindow: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  capabilityTags: string[];
  logoUrl: string | null;
  upstreamMetadata: Record<string, unknown>;
}

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
    tokenizer?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

function inferTags(m: OpenRouterModel): string[] {
  const tags = new Set<string>();
  const id = m.id.toLowerCase();
  const name = (m.name ?? '').toLowerCase();
  const desc = (m.description ?? '').toLowerCase();
  const haystack = `${id} ${name} ${desc}`;

  if (/code|coder|codestral/.test(haystack)) tags.add('code');
  if (/reason|thinking|o1|r1|reflection/.test(haystack)) tags.add('reasoning');
  if (/vision|multimodal|image/.test(haystack) || m.architecture?.input_modalities?.includes('image')) tags.add('vision');
  if (/flash|mini|haiku|nano|8b|7b|instant|turbo/.test(haystack)) tags.add('fast');

  const inputCost = parseFloat(m.pricing?.prompt ?? '0');
  if (inputCost > 0 && inputCost < 0.0000005) tags.add('cheap');
  if (inputCost === 0) tags.add('free');

  const ctx = m.context_length ?? 0;
  if (ctx >= 200_000) tags.add('long-context');

  tags.add('chat');
  return Array.from(tags);
}

function providerLogo(id: string): string | null {
  const [vendor] = id.split('/');
  if (!vendor) return null;
  const map: Record<string, string> = {
    openai: 'https://openrouter.ai/images/icons/OpenAI.svg',
    anthropic: 'https://openrouter.ai/images/icons/Anthropic.svg',
    google: 'https://openrouter.ai/images/icons/Google.svg',
    'meta-llama': 'https://openrouter.ai/images/icons/Meta.svg',
    mistralai: 'https://openrouter.ai/images/icons/Mistral.svg',
    'deepseek': 'https://openrouter.ai/images/icons/DeepSeek.svg',
    qwen: 'https://openrouter.ai/images/icons/Qwen.svg',
    xai: 'https://openrouter.ai/images/icons/XAI.svg',
    cohere: 'https://openrouter.ai/images/icons/Cohere.svg',
    perplexity: 'https://openrouter.ai/images/icons/Perplexity.svg',
    nvidia: 'https://openrouter.ai/images/icons/Nvidia.svg',
  };
  return map[vendor] ?? null;
}

export async function fetchOpenRouterModels(): Promise<UpstreamModel[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(process.env.OPENROUTER_API_KEY
          ? { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }
          : {}),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenRouter models HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as OpenRouterResponse;
    if (!Array.isArray(payload.data)) {
      throw new Error('OpenRouter response missing data[]');
    }

    return payload.data.map((m): UpstreamModel => {
      // OpenRouter pricing is per-token (as string). Convert to per-1k tokens.
      const inputPerToken = parseFloat(m.pricing?.prompt ?? '0');
      const outputPerToken = parseFloat(m.pricing?.completion ?? '0');

      return {
        providerName: 'openrouter',
        modelName: m.id,
        displayName: m.name || m.id,
        description: m.description?.slice(0, 500) ?? null,
        contextWindow: m.top_provider?.context_length ?? m.context_length ?? 8192,
        inputCostPer1k: Number((inputPerToken * 1000).toFixed(6)),
        outputCostPer1k: Number((outputPerToken * 1000).toFixed(6)),
        capabilityTags: inferTags(m),
        logoUrl: providerLogo(m.id),
        upstreamMetadata: m as unknown as Record<string, unknown>,
      };
    });
  } catch (err) {
    logger.error({ err }, 'fetchOpenRouterModels failed');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
