require('dotenv').config({ path: '.env.local' });
global.WebSocket = class MockWebSocket {};

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const axios = require('axios');

const EMAIL = 'julianzuluagaduque@gmail.com';

function decryptToken(encryptedToken, secret) {
  try {
    const key = crypto.createHash('sha256').update(secret).digest();
    const [ivHex, encryptedText] = encryptedToken.split(':');
    if (!ivHex || !encryptedText) return { ok: false, val: encryptedToken, error: 'No iv hex' };
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return { ok: true, val: decrypted };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, {
    auth: { persistSession: false }
  });
  
  const { data: conn } = await supabase
    .from('user_meta_connections')
    .select('*')
    .eq('user_email', EMAIL)
    .maybeSingle();

  if (!conn) {
    console.error('❌ No connection found');
    return;
  }

  const encryptedToken = conn.long_lived_token;
  console.log(`Encrypted Token: ${encryptedToken.slice(0, 30)}...`);

  // Configured local secret in .env.local
  const secret1 = process.env.ENCRYPTION_SECRET;
  const res1 = decryptToken(encryptedToken, secret1);
  console.log(`Attempt 1 (Local configured key: "${secret1}"): ${res1.ok ? '✅ SUCCESS! Token: ' + res1.val.slice(0, 15) + '...' : '❌ FAILED: ' + res1.error}`);

  // The actual secret we generated for the user!
  const secret2 = '9f7a38b1d6c0fe52a84c0de8271a3bc59f7d24e6a810b42f6c91a0ef382b6d5f';
  const res2 = decryptToken(encryptedToken, secret2);
  console.log(`Attempt 2 (Generated user key: "${secret2}"): ${res2.ok ? '✅ SUCCESS! Token: ' + res2.val.slice(0, 15) + '...' : '❌ FAILED: ' + res2.error}`);

  if (res2.ok) {
    console.log(`\n🚀 Haciendo petición de prueba a Meta con el token descifrado...`);
    try {
      const res = await axios.get(`https://graph.facebook.com/v20.0/act_636721115311720/insights`, {
        params: {
          access_token: res2.val,
          date_preset: 'last_7d',
          fields: 'spend,purchase_roas,action_values,cpm,ctr,cpc,clicks,impressions'
        }
      });
      console.log('── Respuesta de Meta Insights ────────────────');
      console.log(JSON.stringify(res.data, null, 2));
      console.log('──────────────────────────────────────────────');
    } catch (error) {
      console.error('❌ Error llamando a Meta:');
      if (error.response) {
        console.error(JSON.stringify(error.response.data, null, 2));
      } else {
        console.error(error.message);
      }
    }
  }
}

main().catch(console.error);
