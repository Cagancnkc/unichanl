import { AuthenticatedUser } from './index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthenticatedUser;
  }
}
