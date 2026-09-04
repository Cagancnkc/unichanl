import crypto from 'node:crypto';
import type { UserTier } from '../db/repositories/userRepository.js';

const POLAR_API_BASE = process.env.POLAR_API_BASE ?? 'https://api.polar.sh';

export interface PolarCheckoutInput {
  productId: string;
  customerEmail?: string;
  successUrl?: string;
  metadata?: Record<string, string>;
  amount?: number;
}

export interface PolarCheckoutResponse {
  id: string;
  url: string;
}

function requireToken(): string {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error('POLAR_ACCESS_TOKEN not configured');
  return token;
}

export async function createCheckoutSession(input: PolarCheckoutInput): Promise<PolarCheckoutResponse> {
  const token = requireToken();
  const body: Record<string, unknown> = {
    products: [input.productId],
  };
  if (input.customerEmail) body.customer_email = input.customerEmail;
  if (input.successUrl) body.success_url = input.successUrl;
  if (input.metadata) body.metadata = input.metadata;
  if (typeof input.amount === 'number') body.amount = input.amount;

  const res = await fetch(`${POLAR_API_BASE}/v1/checkouts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Polar checkout failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { id: string; url: string };
  return { id: json.id, url: json.url };
}

export function verifyWebhookSignature(rawBody: string, headers: Record<string, string | undefined>): boolean {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) throw new Error('POLAR_WEBHOOK_SECRET not configured');

  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signatureHeader = headers['webhook-signature'];
  if (!id || !timestamp || !signatureHeader) return false;

  const secretBytes = secret.startsWith('whsec_')
    ? Buffer.from(secret.slice(6), 'base64')
    : Buffer.from(secret, 'utf8');

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const parts = signatureHeader.split(' ');
  for (const part of parts) {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) continue;
    if (safeEqual(value, expected)) return true;
  }
  return false;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function productIdToTier(productId: string): UserTier {
  const map: Record<string, UserTier> = {};
  if (process.env.POLAR_PRODUCT_PRO) map[process.env.POLAR_PRODUCT_PRO] = 'pro';
  if (process.env.POLAR_PRODUCT_TEAM) map[process.env.POLAR_PRODUCT_TEAM] = 'team';
  if (process.env.POLAR_PRODUCT_ENTERPRISE) map[process.env.POLAR_PRODUCT_ENTERPRISE] = 'enterprise';
  return map[productId] ?? 'free';
}

export async function createRechargeSession(opts: {
  userId: string;
  customerEmail: string;
  amountUsd: number;
  successUrl?: string;
}): Promise<{ url: string; checkoutId: string }> {
  const productId = process.env.POLAR_PRODUCT_CREDIT;
  if (!productId) throw new Error('POLAR_PRODUCT_CREDIT not set');
  const session = await createCheckoutSession({
    productId,
    customerEmail: opts.customerEmail,
    amount: Math.round(opts.amountUsd * 100),
    successUrl: opts.successUrl,
    metadata: { userId: opts.userId, kind: 'credit_topup', amountUsd: String(opts.amountUsd) },
  });
  return { url: session.url, checkoutId: session.id };
}
