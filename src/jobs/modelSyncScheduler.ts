import { syncAllProviders } from '../providers/sync/index.js';
import { logger } from '../utils/logger.js';

const DEFAULT_INTERVAL_MS = 60 * 60 * 1000; // 1 saat

let timer: NodeJS.Timeout | null = null;

export interface ModelSyncScheduler {
  stop: () => void;
}

export function startModelSyncScheduler(): ModelSyncScheduler {
  if (process.env.MODEL_SYNC_DISABLED === 'true') {
    logger.info('Model sync scheduler devre dışı (MODEL_SYNC_DISABLED=true)');
    return { stop: () => {} };
  }

  const intervalMs = parseInt(process.env.MODEL_SYNC_INTERVAL_MS ?? String(DEFAULT_INTERVAL_MS));

  const run = async (): Promise<void> => {
    try {
      await syncAllProviders();
    } catch (err) {
      logger.error({ err }, 'Model sync çalıştırılırken hata');
    }
  };

  // İlk sync'i startup'ta fire-and-forget çalıştır (blocking değil).
  setImmediate(() => {
    logger.info('İlk model sync tetikleniyor (startup)');
    void run();
  });

  timer = setInterval(() => {
    logger.info({ intervalMs }, 'Periyodik model sync tetikleniyor');
    void run();
  }, intervalMs);

  logger.info({ intervalMs }, 'Model sync scheduler başlatıldı');

  return {
    stop: () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
        logger.info('Model sync scheduler durduruldu');
      }
    },
  };
}
