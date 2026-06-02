-- WhatsApp Agent Module Migration
-- Run this in Supabase SQL Editor

-- Agent configuration per user
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  access_token TEXT,
  verify_token TEXT DEFAULT gen_random_uuid()::text,
  agent_name TEXT DEFAULT 'Asistente',
  agent_prompt TEXT,
  is_active BOOLEAN DEFAULT false,
  meta_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Contacts/leads that write via WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  wa_id TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, wa_id)
);

-- Conversation threads per contact
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'bot' CHECK (status IN ('bot', 'human', 'closed')),
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  sender TEXT CHECK (sender IN ('customer', 'bot', 'human')),
  content TEXT NOT NULL,
  wa_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Service role bypass (same pattern as other tables in this project)
CREATE POLICY "Service role full access whatsapp_config" ON whatsapp_config
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access whatsapp_contacts" ON whatsapp_contacts
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access whatsapp_conversations" ON whatsapp_conversations
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access whatsapp_messages" ON whatsapp_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger for whatsapp_config
CREATE OR REPLACE FUNCTION update_whatsapp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_config_updated_at
  BEFORE UPDATE ON whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_config_updated_at();
