-- ─────────────────────────────────────────────────────────────────────────────
-- Run these in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── MIGRATION: Base Table creation for connected_ad_accounts (if missing) ───
CREATE TABLE IF NOT EXISTS connected_ad_accounts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email       TEXT NOT NULL,
  user_id          TEXT,
  ad_account_id    TEXT NOT NULL,
  ad_account_name  TEXT,
  currency         TEXT,
  timezone         TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT FALSE,
  plan             TEXT,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_switched_at TIMESTAMPTZ,
  UNIQUE (user_email, ad_account_id)
);

CREATE INDEX IF NOT EXISTS caa_user_email_active
  ON connected_ad_accounts (user_email, is_active);

ALTER TABLE connected_ad_accounts ENABLE ROW LEVEL SECURITY;

-- Safely create connected_ad_accounts policy only if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'connected_ad_accounts' AND policyname = 'service_full_access_caa'
    ) THEN
        CREATE POLICY "service_full_access_caa" 
        ON connected_ad_accounts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- ── MIGRATION: User Meta Connections for OAuth 2.0 ──────────────────────────
CREATE TABLE IF NOT EXISTS user_meta_connections (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email         TEXT NOT NULL UNIQUE,
  user_id            TEXT,
  fb_user_id         TEXT NOT NULL,
  fb_user_name       TEXT,
  long_lived_token   TEXT NOT NULL,                  -- Cifrado en backend (o texto plano en dev)
  token_expires_at   TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS and add full-access policy for backend services
ALTER TABLE user_meta_connections ENABLE ROW LEVEL SECURITY;

-- Safely create user_meta_connections policy only if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_meta_connections' AND policyname = 'service_full_access_umc'
    ) THEN
        CREATE POLICY "service_full_access_umc" 
        ON user_meta_connections FOR ALL USING (true) WITH CHECK (true);
    END IF;
END
$$;

-- ── MIGRATION: Update connected_ad_accounts with brand assets ──────────────
ALTER TABLE connected_ad_accounts 
  ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_name TEXT,
  ADD COLUMN IF NOT EXISTS instagram_account_id TEXT,
  ADD COLUMN IF NOT EXISTS pixel_id TEXT;
