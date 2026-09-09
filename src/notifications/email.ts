import { logger } from '../utils/logger.js';

export interface EmailInput {
  to: string;
  subject: string;
  html: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendEmail(input: EmailInput): Promise<{ sent: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? 'Unichanl <no-reply@unichanl.com>';

  if (!apiKey) {
    logger.info({ to: input.to, subject: input.subject }, 'email skipped: RESEND_API_KEY not set');
    return { sent: false };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, body: text, to: input.to }, 'resend send failed');
      return { sent: false };
    }
    const json = (await res.json()) as { id?: string };
    return { sent: true, id: json.id };
  } catch (err) {
    logger.warn({ err, to: input.to }, 'resend send threw');
    return { sent: false };
  }
}

export function renderLowBalanceEmail(opts: {
  email: string;
  amountUsd: number;
  checkoutUrl: string;
  balanceUsd: string;
  thresholdUsd: string;
}): { subject: string; html: string } {
  const subject = 'Düşük bakiye — otomatik yenileme hazır';
  const html = `<!doctype html>
<html><body style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111;line-height:1.5;padding:24px;max-width:560px;margin:0 auto">
  <h2 style="margin:0 0 12px">Bakiyeniz düştü</h2>
  <p>Merhaba,</p>
  <p>Unichanl bakiyeniz <strong>$${opts.balanceUsd}</strong> seviyesine düştü ve otomatik yenileme eşiğinizin (<strong>$${opts.thresholdUsd}</strong>) altında. Chat isteklerinin kesilmemesi için <strong>$${opts.amountUsd.toFixed(2)}</strong> tutarında yenileme hazırladık.</p>
  <p style="margin:24px 0">
    <a href="${opts.checkoutUrl}" style="background:#111;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">Şimdi yenile</a>
  </p>
  <p style="color:#666;font-size:13px">Bu bildirim otomatik gönderildi. Otomatik yenilemeyi kapatmak için hesabınıza giriş yapıp fiyatlandırma sayfasından ayarı devre dışı bırakabilirsiniz.</p>
</body></html>`;
  return { subject, html };
}
