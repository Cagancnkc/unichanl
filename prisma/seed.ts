import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROVIDERS = [
  { name: 'openai',    displayName: 'OpenAI',    baseUrl: 'https://api.openai.com/v1' },
  { name: 'anthropic', displayName: 'Anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  { name: 'google',    displayName: 'Google',    baseUrl: 'https://generativelanguage.googleapis.com/v1' },
  { name: 'meta',      displayName: 'Meta',      baseUrl: 'https://openrouter.ai/api/v1' },
  { name: 'mistral',   displayName: 'Mistral',   baseUrl: 'https://api.mistral.ai/v1' },
];

const MODELS = [
  {
    provider: 'openai',
    modelName: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    capabilityTags: ['reasoning', 'coding', 'general', 'long_context'],
    inputCostPer1k: 0.0025,
    outputCostPer1k: 0.01,
    contextWindow: 128000,
    priority: 9,
    avgLatencyMs: 2500,
  },
  {
    provider: 'openai',
    modelName: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    capabilityTags: ['general', 'fast', 'cheap'],
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    contextWindow: 128000,
    priority: 7,
    avgLatencyMs: 1200,
  },
  {
    provider: 'anthropic',
    modelName: 'anthropic/claude-sonnet-4-5',
    displayName: 'Claude Sonnet 4.5',
    capabilityTags: ['reasoning', 'coding', 'general'],
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    contextWindow: 200000,
    priority: 9,
    avgLatencyMs: 3000,
  },
  {
    provider: 'anthropic',
    modelName: 'anthropic/claude-haiku-3-5',
    displayName: 'Claude Haiku 3.5',
    capabilityTags: ['fast', 'cheap', 'general'],
    inputCostPer1k: 0.0008,
    outputCostPer1k: 0.004,
    contextWindow: 200000,
    priority: 7,
    avgLatencyMs: 800,
  },
  {
    provider: 'google',
    modelName: 'google/gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    capabilityTags: ['reasoning', 'long_context', 'general'],
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    contextWindow: 2000000,
    priority: 8,
    avgLatencyMs: 2800,
  },
  {
    provider: 'google',
    modelName: 'google/gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    capabilityTags: ['fast', 'cheap', 'general'],
    inputCostPer1k: 0.000075,
    outputCostPer1k: 0.0003,
    contextWindow: 1000000,
    priority: 6,
    avgLatencyMs: 600,
  },
  {
    provider: 'meta',
    modelName: 'meta-llama/llama-3.1-70b-instruct',
    displayName: 'Llama 3.1 70B',
    capabilityTags: ['reasoning', 'coding', 'cheap'],
    inputCostPer1k: 0.0009,
    outputCostPer1k: 0.0009,
    contextWindow: 131072,
    priority: 7,
    avgLatencyMs: 2200,
  },
  {
    provider: 'meta',
    modelName: 'meta-llama/llama-3.1-8b-instruct',
    displayName: 'Llama 3.1 8B',
    capabilityTags: ['fast', 'cheap', 'general'],
    inputCostPer1k: 0.00006,
    outputCostPer1k: 0.00006,
    contextWindow: 131072,
    priority: 5,
    avgLatencyMs: 700,
  },
  {
    provider: 'mistral',
    modelName: 'mistralai/mistral-large',
    displayName: 'Mistral Large',
    capabilityTags: ['reasoning', 'coding', 'general'],
    inputCostPer1k: 0.002,
    outputCostPer1k: 0.006,
    contextWindow: 128000,
    priority: 8,
    avgLatencyMs: 2000,
  },
  {
    provider: 'mistral',
    modelName: 'mistralai/mistral-7b-instruct',
    displayName: 'Mistral 7B',
    capabilityTags: ['fast', 'cheap', 'general'],
    inputCostPer1k: 0.00025,
    outputCostPer1k: 0.00025,
    contextWindow: 32768,
    priority: 5,
    avgLatencyMs: 900,
  },
];

async function main() {
  console.log('Seed başlıyor...');

  for (const p of PROVIDERS) {
    await prisma.provider.upsert({
      where: { name: p.name },
      update: { displayName: p.displayName, baseUrl: p.baseUrl },
      create: { ...p },
    });
  }
  console.log(`${PROVIDERS.length} provider oluşturuldu.`);

  for (const m of MODELS) {
    const provider = await prisma.provider.findUnique({ where: { name: m.provider } });
    if (!provider) continue;

    const { provider: _p, ...modelData } = m;
    await prisma.model.upsert({
      where: { modelName: m.modelName },
      update: { ...modelData, providerId: provider.id },
      create: { ...modelData, providerId: provider.id },
    });
  }
  console.log(`${MODELS.length} model oluşturuldu.`);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test Kullanıcı',
      plan: 'pro',
    },
  });
  console.log(`Test kullanıcı: ${testUser.email}`);

  console.log('Seed tamamlandı!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
