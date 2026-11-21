// Verifies a Bearer JWT on every protected request.
// Returns 401 for missing / invalid / expired tokens.
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = {
      userId: payload.sub ? Number(payload.sub) : null,
      username: payload.username,
      role: payload.role || null
    };
    return next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid authentication token.';
    return res.status(401).json({ success: false, message: msg });
  }
}

module.exports = auth;