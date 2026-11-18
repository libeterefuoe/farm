// Admin authentication: login + me
// Single admin account stored entirely in .env — no users table.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('../middleware/loginRateLimit');

// POST /api/auth/login
async function login(req, res) {
  const { username, password } = req.body || {};

  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password) {
    rateLimit.recordFailure(req);
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  // Trim + case-insensitive username compare
  const submittedName = username.trim().toLowerCase();
  const expectedName = String(process.env.ADMIN_USERNAME || '').trim().toLowerCase();
  const expectedHash = String(process.env.ADMIN_PASSWORD_HASH || '');

  const nameMatches = submittedName === expectedName;
  const passMatches = expectedHash && await bcrypt.compare(password, expectedHash);

  if (!nameMatches || !passMatches) {
    rateLimit.recordFailure(req);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }

  rateLimit.clear(req);

  const token = jwt.sign(
    { username: process.env.ADMIN_USERNAME },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.json({
    success: true,
    data: { token, username: process.env.ADMIN_USERNAME }
  });
}

// GET /api/auth/me — protected (auth middleware runs before this handler)
function me(req, res) {
  res.json({
    success: true,
    data: { username: req.admin.username }
  });
}

module.exports = { login, me };