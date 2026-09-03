import { prisma } from '../prisma.js';

export const sessionRepository = {
  async findById(id: string) {
    return prisma.session.findUnique({
      where: { id },
      include: { messages: { orderBy: { sequence: 'asc' } } },
    });
  },

  async create(userId: string, systemPrompt?: string) {
    return prisma.session.create({
      data: { userId, systemPrompt },
    });
  },

  async getRecentMessages(sessionId: string, limit = 50) {
    return prisma.message.findMany({
      where: { sessionId },
      orderBy: { sequence: 'desc' },
      take: limit,
    });
  },

  async appendMessage(
    sessionId: string,
    msg: { role: string; content: string; modelUsed?: string; inputTokens?: number; outputTokens?: number },
  ) {
    const count = await prisma.message.count({ where: { sessionId } });
    return prisma.message.create({
      data: { sessionId, sequence: count + 1, ...msg },
    });
  },

  async updateCurrentModel(sessionId: string, model: string) {
    await prisma.session.update({ where: { id: sessionId }, data: { currentModel: model } });
  },

  async listByUser(userId: string, limit = 20) {
    return prisma.session.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: { id: true, title: true, currentModel: true, tokenCount: true, createdAt: true, updatedAt: true },
    });
  },
};
