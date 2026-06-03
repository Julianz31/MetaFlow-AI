-- Add welcome message and audio URL to whatsapp_config
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE whatsapp_config ADD COLUMN IF NOT EXISTS welcome_audio_url TEXT;

-- Create whatsapp-assets storage bucket (run this in the Supabase dashboard
-- or via the Storage API if it doesn't exist yet):
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('whatsapp-assets', 'whatsapp-assets', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- RLS policy for the bucket (users can only upload to their own folder):
--
-- CREATE POLICY "Users upload own audio" ON storage.objects
--   FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'whatsapp-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
--
-- CREATE POLICY "Public read whatsapp-assets" ON storage.objects
--   FOR SELECT USING (bucket_id = 'whatsapp-assets');
