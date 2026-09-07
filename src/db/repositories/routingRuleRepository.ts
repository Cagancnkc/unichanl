import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

export const routingRuleRepository = {
  async listAll() {
    return prisma.routingRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  },
  async create(input: Prisma.RoutingRuleCreateInput) {
    return prisma.routingRule.create({ data: input });
  },
};
