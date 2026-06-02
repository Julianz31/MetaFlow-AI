import { getSupabase } from '../../../lib/supabase';
import { decrypt } from '../../../lib/encrypt';
import Anthropic from '@anthropic-ai/sdk';

// Explicit Next.js API config — bodyParser ON (Meta sends JSON)
export const config = {
  api: { bodyParser: true },
};

const WA_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';

async function sendWhatsAppMessage(phoneNumberId, accessToken, to, text) {
  const url = `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  const result = await res.json();
  console.log('[WA] sendWhatsAppMessage result:', JSON.stringify(result));
  return result;
}

async function processIncomingMessage(supabase, config, waId, contactName, messageText, waMessageId) {
  const userId = config.user_id;
  console.log(`[WA] Processing message from ${waId}: "${messageText}"`);

  // Upsert contact
  const { data: contact, error: contactErr } = await supabase
    .from('whatsapp_contacts')
    .upsert(
      { user_id: userId, wa_id: waId, name: contactName || waId, phone: waId },
      { onConflict: 'user_id,wa_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (contactErr) {
    console.error('[WA] Contact upsert error:', contactErr.message);
    return;
  }
  console.log('[WA] Contact:', contact.id);

  // Find or create conversation
  let conversation;
  const { data: existingConv, error: convErr } = await supabase
    .from('whatsapp_conversations')
    .select()
    .eq('user_id', userId)
    .eq('contact_id', contact.id)
    .maybeSingle();

  if (convErr) console.error('[WA] Conversation fetch error:', convErr.message);

  if (!existingConv) {
    const { data: newConv, error: newConvErr } = await supabase
      .from('whatsapp_conversations')
      .insert({
        user_id: userId,
        contact_id: contact.id,
        status: 'bot',
        last_message: messageText,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (newConvErr) {
      console.error('[WA] Conversation insert error:', newConvErr.message);
      return;
    }
    conversation = newConv;
  } else {
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message: messageText,
        last_message_at: new Date().toISOString(),
        unread_count: (existingConv.unread_count || 0) + 1,
      })
      .eq('id', existingConv.id);
    conversation = existingConv;
  }

  console.log('[WA] Conversation:', conversation.id, 'status:', conversation.status);

  // Save inbound message
  const { error: msgErr } = await supabase.from('whatsapp_messages').insert({
    conversation_id: conversation.id,
    user_id: userId,
    direction: 'inbound',
    sender: 'customer',
    content: messageText,
    wa_message_id: waMessageId,
  });
  if (msgErr) console.error('[WA] Message insert error:', msgErr.message);

  if (conversation.status !== 'bot') {
    console.log('[WA] Conversation is in human/closed mode — skipping bot reply');
    return;
  }

  // Get last 10 messages for Claude history
  const { data: history } = await supabase
    .from('whatsapp_messages')
    .select('sender, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const historyMessages = (history || [])
    .reverse()
    .slice(0, -1) // exclude the message we just saved — we'll append it manually
    .map(m => ({
      role: m.sender === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));

  historyMessages.push({ role: 'user', content: messageText });

  const systemPrompt = `${config.agent_prompt || 'Eres un asistente de ventas amable y profesional.'}

Reglas importantes:
- Responde siempre en el mismo idioma en que te escribe el cliente.
- Sé conciso: máximo 3 párrafos por respuesta.
- Si no sabes algo o necesitas confirmación, di "Voy a consultar con el equipo y te respondo pronto".
- No inventes precios, disponibilidad ni información que no tengas.`;

  console.log('[WA] Calling Claude with', historyMessages.length, 'messages');
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const aiRes = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: historyMessages,
  });

  const botReply = aiRes.content?.[0]?.text || 'En este momento no puedo responder. Te contactaré pronto.';
  console.log('[WA] Bot reply:', botReply.slice(0, 80));

  // Save bot reply
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversation.id,
    user_id: userId,
    direction: 'outbound',
    sender: 'bot',
    content: botReply,
  });

  // Update conversation
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message: botReply, last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);

  // Send via Meta Graph API
  const rawToken = decrypt(config.access_token);
  await sendWhatsAppMessage(config.phone_number_id, rawToken, waId, botReply);

  // Deduct credits (non-blocking — don't fail if this errors)
  if (config.user_email) {
    await supabase.rpc('deduct_credits', { p_user_email: config.user_email, p_amount: 2 })
      .then(() => console.log('[WA] 2 credits deducted from', config.user_email))
      .catch(e => console.error('[WA] Credit deduction error:', e.message));
  }
}

export default async function handler(req, res) {
  // ── GET: Meta webhook verification ─────────────────────────────────────────
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('[WA] Webhook verification attempt — mode:', mode, 'token:', token);

    if (mode !== 'subscribe' || !token) {
      return res.status(400).end();
    }

    const supabase = getSupabase();
    const { data: cfg } = await supabase
      .from('whatsapp_config')
      .select('verify_token')
      .eq('verify_token', token)
      .single();

    if (!cfg) {
      console.error('[WA] Verify token not found:', token);
      return res.status(403).end();
    }

    console.log('[WA] Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  // ── POST: incoming message from Meta ───────────────────────────────────────
  if (req.method === 'POST') {
    console.log('[WA] POST received — body:', JSON.stringify(req.body));

    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      console.log('[WA] value:', JSON.stringify(value));

      // Ignore status updates (delivery receipts, etc.)
      if (!value?.messages?.length) {
        console.log('[WA] No messages in payload — ignoring (probably a status update)');
        return res.status(200).json({ status: 'ok' });
      }

      const phoneNumberId = value.metadata?.phone_number_id;
      const message = value.messages[0];
      const waId = message.from;
      const messageText = message.text?.body;
      const waMessageId = message.id;
      const contactName = value.contacts?.[0]?.profile?.name;

      console.log('[WA] phone_number_id:', phoneNumberId, '| from:', waId, '| type:', message.type, '| text:', messageText);

      if (!phoneNumberId) {
        console.error('[WA] Missing phone_number_id');
        return res.status(200).json({ status: 'ok' });
      }

      if (!messageText) {
        console.log('[WA] Non-text message type:', message.type, '— ignoring');
        return res.status(200).json({ status: 'ok' });
      }

      const supabase = getSupabase();

      // Look up config by phone_number_id
      const { data: cfg, error: cfgErr } = await supabase
        .from('whatsapp_config')
        .select('id, user_id, phone_number_id, access_token, agent_name, agent_prompt, is_active')
        .eq('phone_number_id', phoneNumberId)
        .single();

      if (cfgErr) {
        console.error('[WA] Config lookup error:', cfgErr.message);
        return res.status(200).json({ status: 'ok' });
      }

      if (!cfg) {
        console.error('[WA] No config found for phone_number_id:', phoneNumberId);
        return res.status(200).json({ status: 'ok' });
      }

      if (!cfg.is_active) {
        console.log('[WA] Agent is inactive — ignoring message');
        return res.status(200).json({ status: 'ok' });
      }

      // Get user email for credit deduction
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(cfg.user_id);
        cfg.user_email = userData?.user?.email;
        console.log('[WA] User email:', cfg.user_email);
      } catch (e) {
        console.error('[WA] Could not fetch user email:', e.message);
      }

      // Process synchronously so Vercel doesn't kill the function before finishing
      await processIncomingMessage(supabase, cfg, waId, contactName, messageText, waMessageId);

      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error('[WA] Unhandled error:', err.message, err.stack);
      // Always return 200 to Meta — otherwise it will keep retrying
      return res.status(200).json({ status: 'ok' });
    }
  }

  return res.status(405).end();
}
