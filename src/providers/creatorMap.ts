export type CreatorBrand =
  | 'anthropic'
  | 'openai'
  | 'meta'
  | 'xai'
  | 'google'
  | 'deepseek'
  | 'qwen'
  | 'mistral'
  | 'nvidia'
  | 'cohere'
  | 'perplexity'
  | 'microsoft'
  | 'moonshot'
  | '01ai'
  | 'groq'
  | 'ai21'
  | 'stability'
  | 'databricks'
  | 'amazon'
  | 'baidu'
  | 'zhipu'
  | 'other';

export const CREATOR_DISPLAY_NAMES: Record<CreatorBrand, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  meta: 'Meta',
  xai: 'xAI',
  google: 'Google DeepMind',
  deepseek: 'DeepSeek',
  qwen: 'Alibaba (Qwen)',
  mistral: 'Mistral AI',
  nvidia: 'NVIDIA',
  cohere: 'Cohere',
  perplexity: 'Perplexity',
  microsoft: 'Microsoft',
  moonshot: 'Moonshot AI',
  '01ai': '01.AI',
  groq: 'Groq',
  ai21: 'AI21',
  stability: 'Stability AI',
  databricks: 'Databricks',
  amazon: 'Amazon',
  baidu: 'Baidu',
  zhipu: 'Zhipu AI',
  other: 'Other',
};

export function detectCreatorBrand(modelName: string): CreatorBrand {
  const id = String(modelName || '').toLowerCase();
  if (id.includes('claude') || id.startsWith('anthropic/')) return 'anthropic';
  if (
    id.includes('gpt') ||
    id.includes('openai/') ||
    id.includes('/o1') ||
    id.includes('/o3') ||
    id.includes('/o4')
  ) return 'openai';
  if (id.includes('grok') || id.startsWith('x-ai/')) return 'xai';
  if (id.includes('gemini') || id.includes('gemma') || id.startsWith('google/')) return 'google';
  if (id.includes('deepseek')) return 'deepseek';
  if (id.includes('qwen')) return 'qwen';
  if (id.includes('mistral') || id.includes('mixtral')) return 'mistral';
  if (id.includes('nemotron') || id.startsWith('nvidia/')) return 'nvidia';
  if (id.includes('llama') || id.startsWith('meta-llama/') || id.startsWith('meta/')) return 'meta';
  if (id.includes('cohere') || id.includes('command-')) return 'cohere';
  if (id.includes('perplexity') || id.includes('sonar')) return 'perplexity';
  if (id.includes('phi-') || id.startsWith('microsoft/')) return 'microsoft';
  if (id.includes('kimi') || id.includes('moonshot')) return 'moonshot';
  if (id.startsWith('01-ai/') || id.includes('/yi-')) return '01ai';
  if (id.startsWith('groq/')) return 'groq';
  if (id.startsWith('ai21/') || id.includes('jamba')) return 'ai21';
  if (id.startsWith('stabilityai/') || id.includes('stable-')) return 'stability';
  if (id.startsWith('databricks/') || id.includes('dbrx')) return 'databricks';
  if (id.includes('nova-') || id.startsWith('amazon/')) return 'amazon';
  if (id.includes('ernie') || id.startsWith('baidu/')) return 'baidu';
  if (id.includes('glm-') || id.startsWith('zhipu/') || id.startsWith('thudm/')) return 'zhipu';
  return 'other';
}

export function deriveCreator(
  modelName: string,
  upstreamMetadata?: unknown,
  providerDisplayName?: string,
): { brand: CreatorBrand; displayName: string } {
  const meta = (upstreamMetadata ?? null) as { creator?: string; owned_by?: string } | null;
  const hint = meta?.creator ?? meta?.owned_by;
  if (hint && typeof hint === 'string') {
    const lower = hint.toLowerCase();
    for (const brand of Object.keys(CREATOR_DISPLAY_NAMES) as CreatorBrand[]) {
      if (brand !== 'other' && (lower === brand || lower.includes(brand))) {
        return { brand, displayName: CREATOR_DISPLAY_NAMES[brand] };
      }
    }
  }
  const brand = detectCreatorBrand(modelName);
  if (brand !== 'other') {
    return { brand, displayName: CREATOR_DISPLAY_NAMES[brand] };
  }
  return {
    brand: 'other',
    displayName: providerDisplayName?.trim() || CREATOR_DISPLAY_NAMES.other,
  };
}
