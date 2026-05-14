import crypto from 'crypto';
import { getSupabase } from '../../../lib/supabase';

const GRACE_DAYS = 5;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) return res.status(500).json({ error: 'Wompi events secret no configurado' });

  // Verificar firma del webhook
  const wompiSignature = req.headers['x-event-checksum'];
  if (wompiSignature) {
    const body = JSON.stringify(req.body);
    const timestamp = req.headers['x-event-timestamp'] || '';
    const expected = crypto
      .createHash('sha256')
      .update(`${body}${timestamp}${eventsSecret}`)
      .digest('hex');
    if (wompiSignature !== expected) {
      console.error('Wompi webhook: firma inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }
  }

  const event = req.body;
  const eventType = event?.event;
  const transaction = event?.data?.transaction;

  if (!transaction) return res.status(200).json({ received: true });

  const supabase = getSupabase();
  const reference = transaction.reference || '';
  const status = transaction.status; // APPROVED | DECLINED | VOIDED | ERROR
  const transactionId = transaction.id;
  const userEmail = transaction.customer_email || '';
  const paymentSourceId = transaction.payment_source_id || null;

  // Extraer userId del reference: metaflow-{userId8chars}-{timestamp}
  const refParts = reference.split('-');
  const userIdFragment = refParts[1] || '';

  if (eventType === 'transaction.updated' || eventType === 'transaction.created') {
    if (status === 'APPROVED') {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + 30);
      const graceEnd = new Date(periodEnd);
      graceEnd.setDate(graceEnd.getDate() + GRACE_DAYS);

      // Buscar suscripción existente por email
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_email', userEmail)
        .single();

      if (existing) {
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            grace_period_end: graceEnd.toISOString(),
            last_transaction_id: transactionId,
            payment_source_id: paymentSourceId,
            updated_at: now.toISOString(),
          })
          .eq('user_email', userEmail);
      } else {
        await supabase.from('subscriptions').insert({
          user_email: userEmail,
          status: 'active',
          plan: 'pro',
          amount_cents: 9990000,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          grace_period_end: graceEnd.toISOString(),
          last_transaction_id: transactionId,
          payment_source_id: paymentSourceId,
          wompi_customer_email: userEmail,
        });
      }
    } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
      // Marcar como inactiva si ya existía y venció
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id, current_period_end')
        .eq('user_email', userEmail)
        .single();

      if (existing) {
        const expired = new Date(existing.current_period_end) < new Date();
        if (expired) {
          await supabase
            .from('subscriptions')
            .update({ status: 'inactive', updated_at: new Date().toISOString() })
            .eq('user_email', userEmail);
        }
      }
    }
  }

  return res.status(200).json({ received: true });
}
