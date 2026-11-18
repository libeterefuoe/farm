const express = require('express');
const router = express.Router();
const c = require('../controllers/purchaseController');

router.get('/',      c.list);
router.get('/:id',   c.getById);
router.post('/',     c.create);

module.exports = router;