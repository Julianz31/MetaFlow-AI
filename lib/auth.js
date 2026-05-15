const { getSupabase } = require('./supabase');

/**
 * Validates the Supabase JWT from the Authorization header.
 * Returns the authenticated user or sends a 401 response.
 */
async function requireAuth(req, res) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Sesión inválida o expirada' });
    return null;
  }

  return user;
}

module.exports = { requireAuth };
