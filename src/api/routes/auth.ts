import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { nanoid } from 'nanoid';
import argon2 from 'argon2';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/google', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = req.body as { access_token?: string };
    const accessToken = body?.access_token;

    if (!accessToken) {
      return reply.status(400).send({ error: 'access_token gerekli' });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return reply.status(500).send({ error: 'Supabase config eksik' });
      }

      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: supabaseKey,
        },
      });

      if (!userRes.ok) {
        return reply.status(401).send({ error: 'Geçersiz token' });
      }

      const sbUser = (await userRes.json()) as { email?: string };
      const email = sbUser.email;

      if (!email) {
        return reply.status(401).send({ error: 'E-posta alınamadı' });
      }

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: { email, name: sbUser.email?.split('@')[0] },
        });
      }

      await prisma.apiKey.updateMany({
        where: { userId: user.id, enabled: true },
        data: { enabled: false },
      });

      const raw = 'tkg_' + nanoid(40);
      const hash = await argon2.hash(raw);

      await prisma.apiKey.create({
        data: {
          userId: user.id,
          keyHash: hash,
          keyPrefix: raw.slice(0, 8),
        },
      });

      return reply.send({ key: raw });
    } catch (error) {
      console.error('OAuth error:', error);
      return reply.status(500).send({ error: 'OAuth işlemi başarısız' });
    }
  });
}
