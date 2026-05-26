import axios from 'axios';
import crypto from 'crypto';
import { getSupabase } from '../../../lib/supabase';

// Helper to encrypt the token securely using AES-256-CBC before saving to Supabase
function encryptToken(token) {
  const secret = process.env.ENCRYPTION_SECRET || 'metaflow-default-secret-key-32ch';
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code, state, error, error_description } = req.query;

  // Render error page if the user denied permission or another error occurred
  if (error || !code || !state) {
    const errorMsg = error_description || error || 'Se canceló la conexión con Facebook.';
    return res.status(200).send(renderResponseHtml(false, errorMsg));
  }

  const userEmail = decodeURIComponent(state);
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return res.status(200).send(renderResponseHtml(false, 'Las credenciales de Meta App no están configuradas en el servidor.'));
  }

  // Dynamically rebuild the exact redirect URI used during authorization
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/meta/oauth-callback`;

  try {
    // 1. Exchange temporary authorization code for a short-lived user access token (2-hour limit)
    const shortLivedRes = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code
      }
    });
    const shortLivedToken = shortLivedRes.data.access_token;

    // 2. Exchange short-lived token for a long-lived user access token (60-day limit)
    const longLivedRes = await axios.get('https://graph.facebook.com/v20.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken
      }
    });

    const { access_token: longLivedToken, expires_in } = longLivedRes.data;
    const expiresAt = new Date(Date.now() + (expires_in || 5184000) * 1000).toISOString();

    // 3. Query the user's Facebook profile details to get their name
    const meRes = await axios.get('https://graph.facebook.com/v20.0/me', {
      params: {
        access_token: longLivedToken,
        fields: 'id,name'
      }
    });

    const fbUserId = meRes.data.id;
    const fbUserName = meRes.data.name;

    // 4. Encrypt the token and save it to the database
    const encryptedToken = encryptToken(longLivedToken);
    const supabase = getSupabase();

    // Fetch user details from Supabase auth to link the connection profile securely
    const { data: usersList } = await supabase.auth.admin.listUsers();
    const matchedUser = (usersList?.users || []).find(u => u.email === userEmail);
    const userId = matchedUser ? matchedUser.id : null;

    const { error: upsertError } = await supabase.from('user_meta_connections').upsert(
      {
        user_email: userEmail,
        user_id: userId,
        fb_user_id: fbUserId,
        fb_user_name: fbUserName,
        long_lived_token: encryptedToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_email' }
    );

    if (upsertError) {
      throw new Error(`Error guardando en base de datos: ${upsertError.message}`);
    }

    // 5. Render beautiful glassmorphic success page
    return res.status(200).send(renderResponseHtml(true));
  } catch (err) {
    console.error('Meta OAuth Callback error:', err.response?.data || err.message);
    const apiError = err.response?.data?.error?.message || err.message;
    return res.status(200).send(renderResponseHtml(false, `No se pudo completar la conexión con Meta: ${apiError}`));
  }
}

// Generates an elegant, glassmorphic dark-themed HTML response to display to the user in the popup
function renderResponseHtml(isSuccess, errorMessage = '') {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? 'Conexión Exitosa' : 'Error de Conexión'}</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #8b5cf6;
      --primary-glow: rgba(139, 92, 246, 0.15);
      --success: #10b981;
      --error: #ef4444;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      overflow: hidden;
    }
    .bg-glow {
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, var(--primary-glow) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    }
    .card {
      background: var(--card-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px;
      text-align: center;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      z-index: 2;
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .icon-wrapper {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
    }
    .icon-success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .icon-error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--error);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 12px 0;
      letter-spacing: -0.025em;
    }
    p {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 12px 24px;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
    }
    .btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
    }
    .btn-secondary {
      background: #374151;
      box-shadow: none;
    }
    .btn-secondary:hover {
      background: #4b5563;
      box-shadow: none;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="card">
    ${isSuccess ? `
      <div class="icon-wrapper icon-success">✓</div>
      <h1>Conexión Exitosa</h1>
      <p>Hemos sincronizado tu cuenta de Facebook de forma segura. Esta ventana se cerrará automáticamente en unos segundos.</p>
      <button class="btn" onclick="window.close()">Cerrar Ventana</button>
    ` : `
      <div class="icon-wrapper icon-error">✗</div>
      <h1>Error de Conectividad</h1>
      <p>${errorMessage}</p>
      <button class="btn btn-secondary" onclick="window.close()">Cerrar Ventana</button>
    `}
  </div>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: '${isSuccess ? 'META_OAUTH_SUCCESS' : 'META_OAUTH_ERROR'}',
        error: '${errorMessage.replace(/'/g, "\\'")}'
      }, '*');
    }
    ${isSuccess ? 'setTimeout(function() { window.close(); }, 3000);' : ''}
  </script>
</body>
</html>
  `;
}
