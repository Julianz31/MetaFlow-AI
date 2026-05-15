const { getSupabase } = require('./supabase');

// AI credit cost per operation (analyze / chat)
const CREDIT_COSTS = {
  analyze: 5,
  chat:    2,
};

// Image generation counts against the monthly image quota (not AI credits)
const IMAGE_OPERATION = 'generate_image';

// Rate limits per hour (secondary protection on top of monthly quotas)
const RATE_LIMITS = {
  analyze:        10,
  chat:           30,
  generate_image: 20,
};

// Plan definitions
const PLANS = {
  pro: {
    label:        'Pro',
    amountCents:  9990000,   // 99,900 COP
    aiCredits:    700,
    imageLimit:   60,
    accountLimit: 1,
  },
  business: {
    label:        'Business',
    amountCents:  20990000,  // 209,900 COP
    aiCredits:    1800,
    imageLimit:   150,
    accountLimit: 3,
  },
  agency: {
    label:        'Agency',
    amountCents:  35990000,  // 359,900 COP
    aiCredits:    4000,
    imageLimit:   350,
    accountLimit: 10,
  },
};

/**
 * Returns the user's current credits row.
 */
async function getUserCredits(userEmail) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('user_credits')
    .select('balance, ai_limit, image_used, image_limit, plan, period_end')
    .eq('user_email', userEmail)
    .single();
  return data || { balance: 0, ai_limit: 0, image_used: 0, image_limit: 0, plan: null };
}

async function getBalance(userEmail) {
  const row = await getUserCredits(userEmail);
  return row.balance ?? 0;
}

/**
 * Checks quota before an AI operation.
 * - analyze / chat  → checks AI credit balance
 * - generate_image  → checks monthly image quota
 */
async function checkCredits(userEmail, operation) {
  const supabase = getSupabase();
  const row = await getUserCredits(userEmail);

  if (operation === IMAGE_OPERATION) {
    const remaining = (row.image_limit ?? 0) - (row.image_used ?? 0);
    if (remaining <= 0) {
      return {
        ok: false, status: 402,
        error: `Límite de imágenes del plan alcanzado (${row.image_limit}/mes). Actualiza tu plan para generar más.`,
        image_used: row.image_used,
        image_limit: row.image_limit,
      };
    }
  } else {
    const cost = CREDIT_COSTS[operation];
    if (!cost) return { ok: false, status: 400, error: 'Operación desconocida' };
    if ((row.balance ?? 0) < cost) {
      return {
        ok: false, status: 402,
        error: 'Sin créditos IA suficientes. Actualiza tu plan para continuar.',
        balance: row.balance,
        required: cost,
      };
    }
  }

  // Hourly rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('ai_usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', userEmail)
    .eq('operation', operation)
    .gte('created_at', oneHourAgo);

  const limit = RATE_LIMITS[operation] ?? 10;
  if (count >= limit) {
    return { ok: false, status: 429, error: `Límite por hora alcanzado (${limit} ${operation}). Intenta más tarde.` };
  }

  return { ok: true };
}

/**
 * Deducts AI credits or increments image counter after a successful AI call.
 */
async function deductCredits(userEmail, operation, extra = {}) {
  const supabase = getSupabase();
  const creditsUsed = operation === IMAGE_OPERATION ? 0 : (extra.credits_charged ?? (CREDIT_COSTS[operation] ?? 0));

  if (operation === IMAGE_OPERATION) {
    const imagesGenerated = extra.number_of_images ?? 1;
    await supabase.rpc('increment_image_used', { p_user_email: userEmail, p_count: imagesGenerated });
  } else if (creditsUsed > 0) {
    await supabase.rpc('deduct_credits', { p_user_email: userEmail, p_amount: creditsUsed });
  }

  await supabase.from('ai_usage_logs').insert({
    user_email:          userEmail,
    operation,
    credits_used:        creditsUsed,
    model:               extra.model              || null,
    output_format:       extra.output_format       || null,
    final_width:         extra.final_width         || null,
    final_height:        extra.final_height        || null,
    jpeg_quality:        extra.jpeg_quality        || null,
    number_of_images:    extra.number_of_images    || null,
    estimated_cost_usd:  extra.estimated_cost_usd  ?? null,
    credits_charged:     creditsUsed,
    campaign_id:         extra.campaign_id         || null,
    user_id:             extra.user_id             || null,
    quality_tier:        extra.quality_tier         || null,
    metadata:            extra.metadata ? JSON.stringify(extra.metadata) : null,
  });
}

/**
 * Resets credits for a new billing period (called by Wompi webhook on payment).
 */
async function addCredits(userEmail, amount, plan) {
  const supabase = getSupabase();
  const planDef = PLANS[plan] || PLANS.pro;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  await supabase.rpc('reset_credits_for_plan', {
    p_user_email:   userEmail,
    p_plan:         plan,
    p_ai_credits:   planDef.aiCredits,
    p_image_limit:  planDef.imageLimit,
    p_period_start: now.toISOString(),
    p_period_end:   periodEnd.toISOString(),
  });
}

function creditsForPlan(plan) {
  return PLANS[plan]?.aiCredits ?? PLANS.pro.aiCredits;
}

module.exports = { getBalance, getUserCredits, checkCredits, deductCredits, addCredits, creditsForPlan, CREDIT_COSTS, PLANS };
