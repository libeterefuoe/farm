const express = require('express');
const router = express.Router();
const c = require('../controllers/reportController');

router.get('/top-fruits',           c.topFruits);
router.get('/revenue',              c.revenue);              // ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/top-vendor',           c.topVendor);
router.get('/stock-levels',         c.stockLevels);
router.get('/outstanding-balances', c.outstandingBalances);

module.exports = router;