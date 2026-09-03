import 'dotenv/config';
import { createApp } from './app.js';
import { prisma } from './db/prisma.js';
import { redis } from './cache/redis.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const app = await createApp();
  const port = parseInt(process.env.PORT ?? '3000');
  const host = '0.0.0.0';

  await app.listen({ port, host });
  logger.info({ port, host }, '🚀 AI Gateway sunucusu başlatıldı');

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Sunucu kapatılıyor...');
    try {
      await app.close();
      await prisma.$disconnect();
      await redis.quit();
      logger.info('Temiz kapanış tamamlandı');
    } catch (err) {
      logger.error({ err }, 'Kapanış sırasında hata');
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Yakalanmamış hata');
    shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'İşlenmeyen Promise reddi');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Sunucu başlatılamadı');
  process.exit(1);
});
