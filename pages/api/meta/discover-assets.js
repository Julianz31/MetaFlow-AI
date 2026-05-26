import axios from 'axios';
import crypto from 'crypto';
import { requireAuth } from '../../../lib/auth';
import { getSupabase } from '../../../lib/supabase';

// Decryption helper to retrieve the raw Meta token securely stored in the DB
function decryptToken(encryptedToken) {
  try {
    const secret = process.env.ENCRYPTION_SECRET || 'metaflow-default-secret-key-32ch';
    const key = crypto.createHash('sha256').update(secret).digest();
    const [ivHex, encryptedText] = encryptedToken.split(':');
    if (!ivHex || !encryptedText) return encryptedToken; // Fallback to plain text if iv separator is missing
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed, falling back to raw token:', err.message);
    return encryptedToken;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = await requireAuth(req, res);
  if (!user) return;

  const supabase = getSupabase();

  try {
    // 1. Fetch user connection profile
    const { data: conn, error: connError } = await supabase
      .from('user_meta_connections')
      .select('long_lived_token, fb_user_name, token_expires_at')
      .eq('user_email', user.email)
      .single();

    if (connError || !conn) {
      return res.status(404).json({ error: 'No se encontró conexión de Facebook para tu cuenta. Por favor, conéctala primero.', code: 'NO_CONNECTION' });
    }

    const token = decryptToken(conn.long_lived_token);

    // 2. Fetch Ad Accounts from Meta Graph API
    const adAccountsRes = await axios.get('https://graph.facebook.com/v20.0/me/adaccounts', {
      params: {
        access_token: token,
        fields: 'id,name,currency,timezone_name,account_status'
      }
    });
    const rawAdAccounts = adAccountsRes.data.data || [];

    // Filter out closed or restricted accounts if needed, keeping them simple
    const adAccounts = rawAdAccounts.map(acc => ({
      id: acc.id,
      name: acc.name || acc.id,
      currency: acc.currency,
      timezone: acc.timezone_name,
      status: acc.account_status // 1 = ACTIVE
    }));

    // 3. Fetch Facebook Fan Pages and their linked Instagram business accounts
    const pagesRes = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
      params: {
        access_token: token,
        fields: 'id,name,instagram_business_account{id,username,name}'
      }
    });
    const rawPages = pagesRes.data.data || [];

    const pages = rawPages.map(page => ({
      pageId: page.id,
      pageName: page.name,
      instagramAccount: page.instagram_business_account ? {
        id: page.instagram_business_account.id,
        username: page.instagram_business_account.username || page.instagram_business_account.name,
        name: page.instagram_business_account.name
      } : null
    }));

    // 4. Fetch Pixels associated with each discovered Ad Account in parallel (up to 6 concurrent)
    const pixelsMap = {};
    const limitedAccounts = adAccounts.slice(0, 8); // Performance safeguard

    await Promise.all(
      limitedAccounts.map(async (acc) => {
        try {
          const pixelsRes = await axios.get(`https://graph.facebook.com/v20.0/${acc.id}/adspixels`, {
            params: {
              access_token: token,
              fields: 'id,name'
            }
          });
          pixelsMap[acc.id] = (pixelsRes.data.data || []).map(p => ({
            id: p.id,
            name: p.name || p.id
          }));
        } catch (pixelErr) {
          // Non-fatal, just set empty array if pixel fetch fails for a single account
          console.error(`Error fetching pixels for account ${acc.id}:`, pixelErr.message);
          pixelsMap[acc.id] = [];
        }
      })
    );

    return res.json({
      connectedUser: conn.fb_user_name || 'Usuario de Facebook',
      tokenExpiresAt: conn.token_expires_at,
      decryptedToken: token,
      adAccounts,
      pages,
      pixels: pixelsMap
    });
  } catch (error) {
    console.error('Discover assets error:', error.response?.data || error.message);
    const apiError = error.response?.data?.error?.message || error.message;
    return res.status(500).json({ error: `Error obteniendo activos de Meta: ${apiError}` });
  }
}
