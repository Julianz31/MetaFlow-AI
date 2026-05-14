import crypto from 'crypto';

const AMOUNT_CENTS = 9990000; // 99,900 COP en centavos
const CURRENCY = 'COP';
const PLAN = 'pro';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, userEmail } = req.body;
  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'userId y userEmail son requeridos' });
  }

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!integritySecret || !publicKey) {
    return res.status(500).json({ error: 'Credenciales de Wompi no configuradas' });
  }

  // Reference única por usuario + timestamp
  const reference = `metaflow-${userId.slice(0, 8)}-${Date.now()}`;

  // Firma de integridad: SHA256(reference + amount + currency + integrity_secret)
  const signatureStr = `${reference}${AMOUNT_CENTS}${CURRENCY}${integritySecret}`;
  const signature = crypto.createHash('sha256').update(signatureStr).digest('hex');

  return res.json({
    publicKey,
    reference,
    amountInCents: AMOUNT_CENTS,
    currency: CURRENCY,
    signature,
    plan: PLAN,
    userEmail,
    redirectUrl: `https://metaflow.tech/payment-success?ref=${reference}`,
  });
}
