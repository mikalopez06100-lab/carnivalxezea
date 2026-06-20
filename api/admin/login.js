const {
  checkAdminPassword,
  createSessionToken,
  sessionCookieHeader,
} = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'ADMIN_PASSWORD non configuré sur le serveur.' });
  }
  if (!checkAdminPassword(password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
  }

  const token = createSessionToken();
  const secure = (req.headers['x-forwarded-proto'] || '').includes('https');
  res.setHeader('Set-Cookie', sessionCookieHeader(token, secure));
  return res.status(200).json({ ok: true });
};
