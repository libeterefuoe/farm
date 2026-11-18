const express = require('express');
const router = express.Router();
const c = require('../controllers/stockController');

router.get('/',     c.list);
router.get('/low',  c.lowStock);

module.exports = router;