// Admin authentication: login + me
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
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

  const [users] = await db.execute(
    `SELECT u.user_id, u.username, u.password_hash, u.is_active, r.role_name
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE LOWER(u.username) = LOWER(?)
     LIMIT 1`,
    [username.trim()]
  );
  const user = users[0];
  const passMatches = user && user.is_active && await bcrypt.compare(password, user.password_hash);

  if (!passMatches) {
    rateLimit.recordFailure(req);
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }

  rateLimit.clear(req);

  const token = jwt.sign(
    { sub: String(user.user_id), username: user.username, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.json({
    success: true,
    data: { token, username: user.username }
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