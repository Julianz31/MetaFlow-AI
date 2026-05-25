import crypto from 'crypto';
import { PLANS } from '../../../lib/credits';

const CURRENCY = 'COP';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail, plan = 'pro' } = req.body;
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'userId y userEmail son requeridos' });
  }

  const planDef = PLANS[plan];
  if (!planDef) {
    return res.status(400).json({ error: 'Plan inválido' });
  }

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!integritySecret || !publicKey) {
    return res.status(500).json({ error: 'Credenciales de Wompi no configuradas' });
  }

  // Encode plan in reference so the webhook can read it
  const reference = `metaflow-${userId.slice(0, 8)}-${plan}-${Date.now()}`;
  const amountInCents = planDef.amountCents;

  const signatureStr = `${reference}${amountInCents}${CURRENCY}${integritySecret}`;
  const signature = crypto.createHash('sha256').update(signatureStr).digest('hex');

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'metaflow.tech';
  const redirectUrl = `${protocol}://${host}/pricing?ref=${reference}`;

  return res.json({
    publicKey,
    reference,
    amountInCents,
    currency: CURRENCY,
    signature,
    plan,
    userEmail,
    redirectUrl,
  });
}
