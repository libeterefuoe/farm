
const express = require('express');
const router = express.Router();
const c = require('../controllers/salesController');

router.get('/',              c.list);
router.get('/:id',           c.getById);
router.post('/',             c.create);
router.post('/:id/payments', c.addPayment);

module.exports = router;