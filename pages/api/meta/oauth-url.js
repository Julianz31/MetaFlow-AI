import { requireAuth } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Validate user authentication
  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth already sends 401 if unauthenticated

  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  if (!appId) {
    return res.status(500).json({ error: 'La variable NEXT_PUBLIC_META_APP_ID no está configurada.' });
  }

  // Dynamically determine redirect URI based on the request host (localhost or production)
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/meta/oauth-callback`;

  // Standard Meta OAuth Scopes required for campaign management & asset discovery
  const scopes = [
    'ads_management',
    'ads_read',
    'business_management',
    'pages_read_engagement',
    'pages_show_list'
  ].join(',');

  // The state parameter passes the user's email to associate the callback safely
  const state = encodeURIComponent(user.email);

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

  return res.json({ url: authUrl });
}
