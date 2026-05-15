const { getSupabase } = require('./supabase');
const { PLANS } = require('./credits');

const SWITCH_COOLDOWN_DAYS = 30;

const normalize = (id) => (id && !id.startsWith('act_') ? `act_${id}` : id);

/**
 * Validates that the ad_account_id in the request headers belongs
 * to an *active* account registered by this user.
 * Returns the account row on success, or sends a 4xx response and returns null.
 */
async function requireActiveAccount(req, res, userEmail) {
  const raw = req.headers['x-meta-ad-account-id'];
  if (!raw) {
    res.status(400).json({ error: 'Se requiere x-meta-ad-account-id', code: 'MISSING_ACCOUNT' });
    return null;
  }

  const adAccountId = normalize(raw);
  const supabase = getSupabase();

  const { data } = await supabase
    .from('connected_ad_accounts')
    .select('id, ad_account_id, ad_account_name, is_active')
    .eq('user_email', userEmail)
    .eq('ad_account_id', adAccountId)
    .single();

  if (!data) {
    res.status(403).json({
      error: 'Cuenta publicitaria no registrada. Reconecta tu token en Configuración.',
      code: 'ACCOUNT_NOT_REGISTERED',
    });
    return null;
  }

  if (!data.is_active) {
    res.status(403).json({
      error: 'Cuenta publicitaria no activa. Actívala en Configuración para usarla.',
      code: 'ACCOUNT_NOT_ACTIVE',
    });
    return null;
  }

  return data;
}

/**
 * Syncs the ad accounts returned by Meta into connected_ad_accounts.
 * Activates the first N accounts allowed by the plan (respects existing active state).
 */
async function syncAccounts(userEmail, userId, adAccounts, plan) {
  const supabase = getSupabase();
  const planDef = PLANS[plan] || PLANS.pro;
  const limit = planDef.accountLimit;

  // Fetch currently active accounts for this user
  const { data: currentActive } = await supabase
    .from('connected_ad_accounts')
    .select('ad_account_id')
    .eq('user_email', userEmail)
    .eq('is_active', true);

  const activeSet = new Set((currentActive || []).map((r) => r.ad_account_id));

  // Upsert all accounts Meta returned
  for (const account of adAccounts) {
    const accountId = normalize(account.id);
    await supabase.from('connected_ad_accounts').upsert(
      {
        user_email:      userEmail,
        user_id:         userId || null,
        ad_account_id:   accountId,
        ad_account_name: account.name || accountId,
        currency:        account.currency || null,
        timezone:        account.timezone_name || null,
        plan,
        // Keep existing active state; new accounts start inactive
        is_active: activeSet.has(accountId) ? true : false,
      },
      { onConflict: 'user_email,ad_account_id', ignoreDuplicates: false }
    );
  }

  // If no accounts are active yet, activate the first `limit` ones
  if (activeSet.size === 0 && adAccounts.length > 0) {
    const toActivate = adAccounts.slice(0, limit).map((a) => normalize(a.id));
    await supabase
      .from('connected_ad_accounts')
      .update({ is_active: true })
      .eq('user_email', userEmail)
      .in('ad_account_id', toActivate);
  }
}

/**
 * Activates / deactivates an account for a user, enforcing plan limits and
 * the 30-day switch cooldown for Pro plans.
 * Returns { ok: true } or { ok: false, status, error, code }.
 */
async function toggleAccount(userEmail, adAccountId, activate, plan) {
  const supabase = getSupabase();
  const accountId = normalize(adAccountId);
  const planDef = PLANS[plan] || PLANS.pro;
  const limit = planDef.accountLimit;

  const { data: row } = await supabase
    .from('connected_ad_accounts')
    .select('id, is_active, last_switched_at')
    .eq('user_email', userEmail)
    .eq('ad_account_id', accountId)
    .single();

  if (!row) {
    return { ok: false, status: 404, error: 'Cuenta no encontrada', code: 'ACCOUNT_NOT_FOUND' };
  }

  if (activate) {
    // Check plan account limit
    const { count } = await supabase
      .from('connected_ad_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_email', userEmail)
      .eq('is_active', true);

    if (count >= limit) {
      return {
        ok: false, status: 403,
        error: `Tu plan ${planDef.label} permite máximo ${limit} cuenta${limit > 1 ? 's' : ''} activa${limit > 1 ? 's' : ''}. Actualiza tu plan para agregar más.`,
        code: 'PLAN_LIMIT_REACHED',
        limit,
      };
    }

    // Pro plan: 30-day switch cooldown
    if (plan === 'pro' && row.last_switched_at) {
      const daysSince = (Date.now() - new Date(row.last_switched_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < SWITCH_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(SWITCH_COOLDOWN_DAYS - daysSince);
        return {
          ok: false, status: 403,
          error: `Plan Pro: solo puedes cambiar tu cuenta activa 1 vez cada ${SWITCH_COOLDOWN_DAYS} días. Podrás cambiarla en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}.`,
          code: 'SWITCH_COOLDOWN',
          daysLeft,
        };
      }
    }
  }

  await supabase
    .from('connected_ad_accounts')
    .update({
      is_active:        activate,
      last_switched_at: activate ? new Date().toISOString() : row.last_switched_at,
    })
    .eq('user_email', userEmail)
    .eq('ad_account_id', accountId);

  return { ok: true };
}

module.exports = { requireActiveAccount, syncAccounts, toggleAccount, normalize };
