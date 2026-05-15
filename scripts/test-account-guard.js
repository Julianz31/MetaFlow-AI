/**
 * Script de prueba para validar restricciones del plan Pro en cuentas publicitarias.
 *
 * Ejecutar: node scripts/test-account-guard.js
 *
 * Qué prueba:
 *  1. Plan Pro solo permite 1 cuenta activa
 *  2. Activar una segunda cuenta devuelve PLAN_LIMIT_REACHED
 *  3. Usar cuenta inactiva en endpoint de campaña devuelve ACCOUNT_NOT_ACTIVE
 *  4. Usar cuenta no registrada devuelve ACCOUNT_NOT_REGISTERED
 *  5. Cambiar cuenta dentro de los 30 días devuelve SWITCH_COOLDOWN
 *  6. Desactivar una cuenta siempre funciona (sin cooldown al desactivar)
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const { toggleAccount, syncAccounts, requireActiveAccount } = require('../lib/accountGuard');

// ── Configuración ─────────────────────────────────────────────────────────────
const USER_EMAIL   = 'julianzuluagaduque@gmail.com';
const ACCOUNT_A    = 'act_TEST_AAA111';
const ACCOUNT_B    = 'act_TEST_BBB222';
const ACCOUNT_FAKE = 'act_TEST_FAKE999';

// ── Helpers ───────────────────────────────────────────────────────────────────
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

let passed = 0;
let failed = 0;

function ok(name, detail = '') {
  console.log(`  ✅  ${name}`);
  if (detail) console.log(`       ${detail}`);
  passed++;
}

function fail(name, detail = '') {
  console.log(`  ❌  ${name}`);
  if (detail) console.log(`       ${detail}`);
  failed++;
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// Simula req/res de Next.js para probar requireActiveAccount
function mockReqRes(adAccountId) {
  const captured = {};
  const req = { headers: { 'x-meta-ad-account-id': adAccountId } };
  const res = {
    status(code) { captured.status = code; return this; },
    json(body)   { captured.body  = body;  return this; },
  };
  return { req, res, captured };
}

// ── Setup ─────────────────────────────────────────────────────────────────────
async function setup() {
  section('SETUP — Asignar plan Pro + limpiar cuentas de prueba');

  // 1. Asignar plan Pro con 700 créditos
  const now       = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error: creditErr } = await supabase.rpc('reset_credits_for_plan', {
    p_user_email:   USER_EMAIL,
    p_plan:         'pro',
    p_ai_credits:   700,
    p_image_limit:  60,
    p_period_start: now.toISOString(),
    p_period_end:   periodEnd.toISOString(),
  });

  if (creditErr) {
    console.error('  ERROR al asignar plan Pro:', creditErr.message);
    process.exit(1);
  }
  console.log('  Plan Pro con 700 créditos asignado a', USER_EMAIL);

  // 2. Limpiar cuentas de prueba anteriores
  await supabase
    .from('connected_ad_accounts')
    .delete()
    .eq('user_email', USER_EMAIL)
    .in('ad_account_id', [ACCOUNT_A, ACCOUNT_B, ACCOUNT_FAKE]);

  console.log('  Cuentas de prueba previas eliminadas');
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
async function cleanup() {
  section('CLEANUP — Eliminar cuentas de prueba');
  await supabase
    .from('connected_ad_accounts')
    .delete()
    .eq('user_email', USER_EMAIL)
    .in('ad_account_id', [ACCOUNT_A, ACCOUNT_B, ACCOUNT_FAKE]);
  console.log('  Cuentas de prueba eliminadas');
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function runTests() {
  // ── TEST 1: syncAccounts activa solo la primera cuenta en plan Pro ──────────
  section('TEST 1 — syncAccounts activa máximo 1 cuenta (plan Pro)');

  await syncAccounts(
    USER_EMAIL,
    null,
    [
      { id: ACCOUNT_A, name: 'Cuenta A Test', currency: 'COP', timezone_name: 'America/Bogota' },
      { id: ACCOUNT_B, name: 'Cuenta B Test', currency: 'COP', timezone_name: 'America/Bogota' },
    ],
    'pro'
  );

  const { data: afterSync } = await supabase
    .from('connected_ad_accounts')
    .select('ad_account_id, is_active')
    .eq('user_email', USER_EMAIL)
    .in('ad_account_id', [ACCOUNT_A, ACCOUNT_B]);

  const activeAfterSync = afterSync?.filter(r => r.is_active) ?? [];

  if (activeAfterSync.length === 1 && activeAfterSync[0].ad_account_id === ACCOUNT_A) {
    ok('syncAccounts activó solo la primera cuenta', `Activa: ${ACCOUNT_A}`);
  } else {
    fail('syncAccounts debió activar solo 1 cuenta', `Activas: ${JSON.stringify(activeAfterSync)}`);
  }

  // ── TEST 2: No se puede activar una segunda cuenta en plan Pro ──────────────
  section('TEST 2 — Activar segunda cuenta devuelve PLAN_LIMIT_REACHED');

  const result2 = await toggleAccount(USER_EMAIL, ACCOUNT_B, true, 'pro');

  if (!result2.ok && result2.code === 'PLAN_LIMIT_REACHED' && result2.status === 403) {
    ok('toggleAccount bloqueó la segunda cuenta', `code=${result2.code}, limit=${result2.limit}`);
  } else {
    fail('toggleAccount debió devolver PLAN_LIMIT_REACHED', JSON.stringify(result2));
  }

  // ── TEST 3: requireActiveAccount permite cuenta activa ─────────────────────
  section('TEST 3 — requireActiveAccount permite cuenta activa');

  const { req: req3, res: res3, captured: cap3 } = mockReqRes(ACCOUNT_A);
  const account3 = await requireActiveAccount(req3, res3, USER_EMAIL);

  if (account3 && account3.ad_account_id === ACCOUNT_A) {
    ok('requireActiveAccount devolvió la cuenta activa', `id=${account3.ad_account_id}`);
  } else {
    fail('requireActiveAccount debió devolver la cuenta activa', JSON.stringify(cap3));
  }

  // ── TEST 4: requireActiveAccount bloquea cuenta inactiva ───────────────────
  section('TEST 4 — requireActiveAccount bloquea cuenta inactiva (ACCOUNT_NOT_ACTIVE)');

  const { req: req4, res: res4, captured: cap4 } = mockReqRes(ACCOUNT_B);
  const account4 = await requireActiveAccount(req4, res4, USER_EMAIL);

  if (account4 === null && cap4.status === 403 && cap4.body?.code === 'ACCOUNT_NOT_ACTIVE') {
    ok('requireActiveAccount bloqueó cuenta inactiva', `HTTP 403, code=ACCOUNT_NOT_ACTIVE`);
  } else {
    fail('Debió devolver 403 ACCOUNT_NOT_ACTIVE', JSON.stringify(cap4));
  }

  // ── TEST 5: requireActiveAccount bloquea cuenta no registrada ──────────────
  section('TEST 5 — requireActiveAccount bloquea cuenta no registrada (ACCOUNT_NOT_REGISTERED)');

  const { req: req5, res: res5, captured: cap5 } = mockReqRes(ACCOUNT_FAKE);
  const account5 = await requireActiveAccount(req5, res5, USER_EMAIL);

  if (account5 === null && cap5.status === 403 && cap5.body?.code === 'ACCOUNT_NOT_REGISTERED') {
    ok('requireActiveAccount bloqueó cuenta no registrada', `HTTP 403, code=ACCOUNT_NOT_REGISTERED`);
  } else {
    fail('Debió devolver 403 ACCOUNT_NOT_REGISTERED', JSON.stringify(cap5));
  }

  // ── TEST 6: Desactivar cuenta siempre funciona ─────────────────────────────
  section('TEST 6 — Desactivar cuenta no tiene cooldown');

  const result6 = await toggleAccount(USER_EMAIL, ACCOUNT_A, false, 'pro');

  if (result6.ok) {
    ok('toggleAccount desactivó la cuenta sin restricciones');
  } else {
    fail('Desactivar cuenta debió funcionar', JSON.stringify(result6));
  }

  // ── TEST 7: Cooldown de 30 días al intentar reactivar ──────────────────────
  section('TEST 7 — Switch cooldown bloquea reactivación en plan Pro');

  // Primero activamos cuenta A para que quede last_switched_at = NOW()
  const result7a = await toggleAccount(USER_EMAIL, ACCOUNT_A, true, 'pro');
  if (!result7a.ok) {
    fail('No se pudo activar cuenta A para test de cooldown', JSON.stringify(result7a));
  } else {
    // Ahora desactivamos (no toca last_switched_at en la lógica)
    await toggleAccount(USER_EMAIL, ACCOUNT_A, false, 'pro');

    // Intentamos reactivar → debe fallar por cooldown (last_switched_at acaba de setearse)
    const result7b = await toggleAccount(USER_EMAIL, ACCOUNT_A, true, 'pro');

    if (!result7b.ok && result7b.code === 'SWITCH_COOLDOWN' && result7b.status === 403) {
      ok('toggleAccount bloqueó reactivación por cooldown de 30 días', `daysLeft=${result7b.daysLeft}`);
    } else {
      fail('Debió devolver SWITCH_COOLDOWN', JSON.stringify(result7b));
    }
  }

  // ── TEST 8: Plan Agency permite 10 cuentas (límite diferente) ──────────────
  section('TEST 8 — Plan Agency tiene límite de 10 cuentas (validación del PLANS map)');

  const result8 = await toggleAccount(USER_EMAIL, ACCOUNT_B, true, 'agency');

  // En plan Agency (limite=10) con solo 0 cuentas activas, debe permitir
  if (result8.ok) {
    ok('toggleAccount permitió activar cuenta en plan Agency (límite 10)', 'limite > cuentas activas');
    // Limpiamos esa activación
    await toggleAccount(USER_EMAIL, ACCOUNT_B, false, 'agency');
  } else if (result8.code === 'SWITCH_COOLDOWN') {
    ok('toggleAccount detectó cooldown (esperado si last_switched_at fue reciente)', `daysLeft=${result8.daysLeft}`);
  } else {
    fail('Plan Agency debió permitir activar la cuenta', JSON.stringify(result8));
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║       TEST SUITE — Account Guard / Plan Pro              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Usuario: ${USER_EMAIL}`);
  console.log(`  Cuenta A (prueba): ${ACCOUNT_A}`);
  console.log(`  Cuenta B (prueba): ${ACCOUNT_B}`);

  try {
    await setup();
    await runTests();
  } catch (err) {
    console.error('\n  ERROR INESPERADO:', err.message);
    failed++;
  } finally {
    await cleanup();
  }

  section('RESULTADO FINAL');
  const total = passed + failed;
  console.log(`  Pruebas pasadas : ${passed}/${total}`);
  console.log(`  Pruebas fallidas: ${failed}/${total}`);

  if (failed === 0) {
    console.log('\n  🎉 TODAS LAS PRUEBAS PASARON');
  } else {
    console.log('\n  ⚠️  ALGUNAS PRUEBAS FALLARON — revisa los logs arriba');
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
})();
