-- ─────────────────────────────────────────────────────────────────────────────
-- Run these in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ── MIGRATION 4: Connected ad accounts (plan-gated, per-user) ────────────────
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
CREATE POLICY "service_full_access_caa"
  ON connected_ad_accounts FOR ALL USING (true) WITH CHECK (true);
-- ─────────────────────────────────────────────────────────────────────────────

-- ── MIGRATION 3: Image quota + AI limit columns in user_credits ──────────────
ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS ai_limit      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_used    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_limit   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_end    TIMESTAMPTZ;

-- Reset function: called on each Wompi payment approval
CREATE OR REPLACE FUNCTION reset_credits_for_plan(
  p_user_email  TEXT,
  p_plan        TEXT,
  p_ai_credits  INTEGER,
  p_image_limit INTEGER,
  p_period_start TIMESTAMPTZ,
  p_period_end   TIMESTAMPTZ
)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO user_credits
    (user_email, balance, ai_limit, image_used, image_limit, plan, period_start, period_end, updated_at)
  VALUES
    (p_user_email, p_ai_credits, p_ai_credits, 0, p_image_limit, p_plan, p_period_start, p_period_end, NOW())
  ON CONFLICT (user_email) DO UPDATE SET
    balance       = p_ai_credits,
    ai_limit      = p_ai_credits,
    image_used    = 0,
    image_limit   = p_image_limit,
    plan          = p_plan,
    period_start  = p_period_start,
    period_end    = p_period_end,
    updated_at    = NOW();
END;
$$;
-- ─────────────────────────────────────────────────────────────────────────────

-- Increment image counter (called after each successful image generation)
CREATE OR REPLACE FUNCTION increment_image_used(p_user_email TEXT, p_count INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE user_credits
  SET image_used = image_used + p_count, updated_at = NOW()
  WHERE user_email = p_user_email;
END;
$$;
-- ─────────────────────────────────────────────────────────────────────────────

-- ── MIGRATION 2: Extended image generation log fields ─────────────────────────
-- Run this block if ai_usage_logs already exists from migration 1
ALTER TABLE ai_usage_logs
  ADD COLUMN IF NOT EXISTS output_format      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS final_width        INTEGER,
  ADD COLUMN IF NOT EXISTS final_height       INTEGER,
  ADD COLUMN IF NOT EXISTS jpeg_quality       INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_images   INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS credits_charged    INTEGER,
  ADD COLUMN IF NOT EXISTS campaign_id        TEXT,
  ADD COLUMN IF NOT EXISTS user_id            TEXT,
  ADD COLUMN IF NOT EXISTS quality_tier       VARCHAR(50);
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Credits balance per user
CREATE TABLE IF NOT EXISTS user_credits (
  user_email  TEXT PRIMARY KEY,
  balance     INTEGER NOT NULL DEFAULT 0,
  plan        VARCHAR(50),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI usage log (one row per successful AI call)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT NOT NULL,
  operation    VARCHAR(50) NOT NULL,  -- 'analyze' | 'chat' | 'generate_image'
  credits_used INTEGER NOT NULL,
  model        VARCHAR(100),
  metadata     TEXT,                  -- JSON string with extra info
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_usage_logs_user_op_time
  ON ai_usage_logs (user_email, operation, created_at DESC);

-- 3. Atomic credit deduction function (prevents balance going below 0)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_email TEXT, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_credits
  SET
    balance    = GREATEST(0, balance - p_amount),
    updated_at = NOW()
  WHERE user_email = p_user_email;
END;
$$;

-- 4. RLS policies (enable RLS on both tables first)
ALTER TABLE user_credits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs  ENABLE ROW LEVEL SECURITY;

-- Service role (used by Next.js server) can read/write everything
CREATE POLICY "service_full_access_credits"
  ON user_credits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_full_access_logs"
  ON ai_usage_logs FOR ALL
  USING (true)
  WITH CHECK (true);
