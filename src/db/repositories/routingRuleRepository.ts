import { prisma } from '../prisma.js';

export const routingRuleRepository = {
  async listAll() {
    return prisma.routingRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  },
};
