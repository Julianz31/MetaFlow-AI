import { getSupabase } from '../../../lib/supabase';
import { decrypt } from '../../../lib/encrypt';
import Anthropic from '@anthropic-ai/sdk';

const WA_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v19.0';

async function sendWhatsAppMessage(phoneNumberId, accessToken, to, text) {
  const url = `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  return res.json();
}

async function processIncomingMessage(supabase, config, waId, contactName, messageText, waMessageId) {
  const userId = config.user_id;

  // Upsert contact
  const { data: contact } = await supabase
    .from('whatsapp_contacts')
    .upsert(
      { user_id: userId, wa_id: waId, name: contactName || waId, phone: waId },
      { onConflict: 'user_id,wa_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (!contact) return;

  // Upsert conversation
  let { data: conversation } = await supabase
    .from('whatsapp_conversations')
    .select()
    .eq('user_id', userId)
    .eq('contact_id', contact.id)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from('whatsapp_conversations')
      .insert({ user_id: userId, contact_id: contact.id, status: 'bot', last_message: messageText, last_message_at: new Date().toISOString() })
      .select()
      .single();
    conversation = newConv;
  } else {
    await supabase
      .from('whatsapp_conversations')
      .update({ last_message: messageText, last_message_at: new Date().toISOString(), unread_count: (conversation.unread_count || 0) + 1 })
      .eq('id', conversation.id);
  }

  if (!conversation) return;

  // Save inbound message
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversation.id,
    user_id: userId,
    direction: 'inbound',
    sender: 'customer',
    content: messageText,
    wa_message_id: waMessageId,
  });

  if (conversation.status !== 'bot') return;

  // Get last 10 messages for history
  const { data: history } = await supabase
    .from('whatsapp_messages')
    .select('sender, content')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const historyMessages = (history || [])
    .reverse()
    .slice(0, -1) // exclude the message we just inserted (already appended as last user turn)
    .map(m => ({
      role: m.sender === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }));

  // Always end with a user turn
  historyMessages.push({ role: 'user', content: messageText });

  const systemPrompt = `${config.agent_prompt || 'Eres un asistente de ventas amable y profesional.'}

Reglas importantes:
- Responde siempre en el mismo idioma en que te escribe el cliente.
- Sé conciso: máximo 3 párrafos por respuesta.
- Si no sabes algo o necesitas confirmación, di "Voy a consultar con el equipo y te respondo pronto".
- No inventes precios, disponibilidad ni información que no tengas.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const aiRes = await anthropic.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: historyMessages,
  });

  const botReply = aiRes.content?.[0]?.text || 'En este momento no puedo responder. Te contactaré pronto.';

  // Save bot outbound message
  await supabase.from('whatsapp_messages').insert({
    conversation_id: conversation.id,
    user_id: userId,
    direction: 'outbound',
    sender: 'bot',
    content: botReply,
  });

  // Update conversation last_message
  await supabase
    .from('whatsapp_conversations')
    .update({ last_message: botReply, last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);

  // Send via Meta Graph API
  const rawToken = decrypt(config.access_token);
  await sendWhatsAppMessage(config.phone_number_id, rawToken, waId, botReply);

  // Deduct 2 credits
  await supabase.rpc('deduct_credits', { p_user_email: config.user_email, p_amount: 2 });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Meta webhook verification
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode !== 'subscribe' || !token) {
      return res.status(400).end();
    }

    const supabase = getSupabase();
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('verify_token')
      .eq('verify_token', token)
      .single();

    if (!config) return res.status(403).end();

    return res.status(200).send(challenge);
  }

  if (req.method === 'POST') {
    // Respond to Meta immediately — process async
    res.status(200).json({ status: 'ok' });

    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;

      if (!value?.messages?.length) return;

      const phoneNumberId = value.metadata?.phone_number_id;
      const message = value.messages[0];
      const waId = message.from;
      const messageText = message.text?.body;
      const waMessageId = message.id;
      const contactName = value.contacts?.[0]?.profile?.name;

      if (!phoneNumberId || !messageText || !waId) return;

      const supabase = getSupabase();
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*, user_id, phone_number_id, access_token, verify_token, agent_name, agent_prompt, is_active, meta_verified')
        .eq('phone_number_id', phoneNumberId)
        .single();

      if (!config || !config.is_active) return;

      // Fetch user email for credit deduction
      const { data: { user } } = await supabase.auth.admin.getUserById(config.user_id);
      config.user_email = user?.email;

      await processIncomingMessage(supabase, config, waId, contactName, messageText, waMessageId);
    } catch (err) {
      console.error('[WhatsApp Webhook] Error:', err.message);
    }

    return;
  }

  return res.status(405).end();
}
