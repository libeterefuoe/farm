const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/loginRateLimit');
const auth = require('../middleware/auth');
const c = require('../controllers/authController');

// Public — rate-limited
router.post('/login', rateLimit, c.login);

// Protected
router.get('/me', auth, c.me);

module.exports = router;