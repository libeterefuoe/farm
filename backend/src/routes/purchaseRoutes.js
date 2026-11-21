const express = require('express');
const router = express.Router();
const c = require('../controllers/purchaseController');

router.get('/',      c.list);
router.get('/unstocked-history', c.listUnstockedHistory);
router.post('/reconcile-stock', c.reconcileStock);
router.get('/:id',   c.getById);
router.post('/',     c.create);

module.exports = router;