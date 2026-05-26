import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';
import { getUserCredits, PLANS } from '../../../lib/credits';
import { normalize } from '../../../lib/accountGuard';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const {
    adAccountId,
    adAccountName,
    facebookPageId,
    facebookPageName,
    instagramAccountId,
    pixelId,
    currency,
    timezone
  } = req.body;

  if (!adAccountId) {
    return res.status(400).json({ error: 'Se requiere el parámetro adAccountId.' });
  }

  const normalizedId = normalize(adAccountId);
  const supabase = getSupabase();

  try {
    // 1. Fetch user subscription details to respect account limits
    const credits = await getUserCredits(user.email);
    const plan = credits.plan || 'pro';
    const planDef = PLANS[plan] || PLANS.pro;
    const limit = planDef.accountLimit;

    // 2. Manage limits: if the plan allows only 1 active account (e.g. Pro),
    // deactivate other accounts before activating the new one to prevent limits errors
    if (limit === 1) {
      await supabase
        .from('connected_ad_accounts')
        .update({ is_active: false })
        .eq('user_email', user.email)
        .neq('ad_account_id', normalizedId);
    }

    // 3. Upsert the brand configuration to the connected_ad_accounts table
    const { error: upsertError } = await supabase.from('connected_ad_accounts').upsert(
      {
        user_email: user.email,
        user_id: user.id || null,
        ad_account_id: normalizedId,
        ad_account_name: adAccountName || normalizedId,
        facebook_page_id: facebookPageId || null,
        facebook_page_name: facebookPageName || null,
        instagram_account_id: instagramAccountId || null,
        pixel_id: pixelId || null,
        currency: currency || null,
        timezone: timezone || null,
        plan,
        is_active: true, // Automatically activate the newly selected brand config
        last_switched_at: new Date().toISOString()
      },
      { onConflict: 'user_email,ad_account_id' }
    );

    if (upsertError) {
      throw new Error(`Error en el guardado de Supabase: ${upsertError.message}`);
    }

    return res.json({ ok: true, adAccountId: normalizedId });
  } catch (error) {
    console.error('Save brand config error:', error.message);
    return res.status(500).json({ error: `Error al guardar la configuración de marca: ${error.message}` });
  }
}
