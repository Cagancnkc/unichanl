import { logger } from '../../utils/logger.js';
import type { UpstreamModel } from './openRouterSync.js';

const NVIDIA_BASE = process.env.NVIDIA_API_BASE ?? 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODELS_URL = `${NVIDIA_BASE}/models`;
const FETCH_TIMEOUT_MS = 20_000;

interface NvidiaModel {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  root?: string;
}

interface NvidiaResponse {
  data: NvidiaModel[];
  object?: string;
}

function inferTags(id: string): string[] {
  const lower = id.toLowerCase();
  let primary = 'general';
  if (/nemotron.*70|reason|r1|thinking|deepseek-r1/.test(lower)) primary = 'reasoning';
  else if (/code|coder|codestral/.test(lower)) primary = 'code';
  else if (/vision|multimodal|vlm/.test(lower)) primary = 'vision';
  else if (/mini|nano|8b|7b|small|nemotron.*mini/.test(lower)) primary = 'fast';

  const tags = new Set<string>([primary, 'sınırsız']);
  if (/70b|405b|super|large/.test(lower)) tags.add('long-context');
  return Array.from(tags);
}

function inferContextWindow(id: string): number {
  const lower = id.toLowerCase();
  if (/deepseek-r1|nemotron.*70/.test(lower)) return 128_000;
  if (/nemotron.*super/.test(lower)) return 128_000;
  if (/mistral.*nemo/.test(lower)) return 128_000;
  if (/qwen.*coder/.test(lower)) return 32_768;
  return 32_768;
}

function displayNameFrom(id: string): string {
  const parts = id.split('/');
  const raw = parts[parts.length - 1] ?? id;
  return raw
    .split(/[-_]/)
    .map((p) => (p.length > 0 ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

export async function fetchNvidiaModels(): Promise<UpstreamModel[]> {
  if (!process.env.NVIDIA_API_KEY) {
    logger.warn('NVIDIA_API_KEY tanımsız — NVIDIA sync atlanıyor');
    return [];
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(NVIDIA_MODELS_URL, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`NVIDIA models HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await response.json()) as NvidiaResponse;
    if (!Array.isArray(payload.data)) {
      throw new Error('NVIDIA response missing data[]');
    }

    return payload.data.map((m): UpstreamModel => ({
      providerName: 'nvidia',
      modelName: m.id,
      displayName: displayNameFrom(m.id),
      description: null,
      contextWindow: inferContextWindow(m.id),
      inputCostPer1k: 0,
      outputCostPer1k: 0,
      capabilityTags: inferTags(m.id),
      logoUrl: 'https://openrouter.ai/images/icons/Nvidia.svg',
      upstreamMetadata: m as unknown as Record<string, unknown>,
    }));
  } catch (err) {
    logger.error({ err }, 'fetchNvidiaModels failed');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
