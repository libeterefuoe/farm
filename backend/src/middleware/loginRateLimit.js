// Lightweight in-memory rate limiter — max 5 failed attempts per IP per 15 minutes.
// Successful logins clear the counter for that IP.
// No external dependency required.
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

function loginRateLimit(req, res, next) {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && now - entry.firstAt > WINDOW_MS) {
    attempts.delete(key);
  }

  const current = attempts.get(key);
  if (current && current.count >= MAX_FAILS) {
    const remainingMs = WINDOW_MS - (now - current.firstAt);
    const minutes = Math.ceil(remainingMs / 60000);
    return res.status(429).json({
      success: false,
      message: `Too many failed attempts. Try again in ${minutes} minute(s).`
    });
  }
  next();
}

loginRateLimit.recordFailure = (req) => {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, firstAt: now });
  } else {
    entry.count += 1;
  }
};

loginRateLimit.clear = (req) => {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  attempts.delete(key);
};

module.exports = loginRateLimit;