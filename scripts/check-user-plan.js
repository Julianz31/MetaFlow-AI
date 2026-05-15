require('dotenv').config({ path: '.env.local' });
const { getUserCredits } = require('../lib/credits');

const EMAIL = 'julianzuluagaduque@gmail.com';

async function main() {
  const row = await getUserCredits(EMAIL);

  if (!row || !row.plan) {
    console.log('❌ Usuario no encontrado o sin plan asignado');
    process.exit(1);
  }

  const ok = row.plan === 'pro' && row.balance === row.ai_limit;

  console.log('\n── Estado del usuario ──────────────────────');
  console.log(`  Email       : ${EMAIL}`);
  console.log(`  Plan        : ${row.plan}`);
  console.log(`  Créditos IA : ${row.balance} / ${row.ai_limit}`);
  console.log(`  Imágenes    : ${row.image_used} / ${row.image_limit} usadas`);
  console.log(`  Período fin : ${row.period_end ? new Date(row.period_end).toLocaleDateString('es-CO') : 'N/A'}`);
  console.log('────────────────────────────────────────────');
  console.log(ok ? '✅ Plan Pro asignado correctamente' : '⚠️  Revisa los valores — algo puede estar mal');
}

main().catch(console.error);
