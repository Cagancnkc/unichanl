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
  async update(id: string, data: Prisma.RoutingRuleUpdateInput) {
    return prisma.routingRule.update({ where: { id }, data });
  },
  async remove(id: string) {
    return prisma.routingRule.delete({ where: { id } });
  },
  async findById(id: string) {
    return prisma.routingRule.findUnique({ where: { id } });
  },
};
