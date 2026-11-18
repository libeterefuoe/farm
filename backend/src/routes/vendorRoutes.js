const express = require('express');
const router = express.Router();
const c = require('../controllers/vendorController');

router.get('/',     c.list);      // supports ?search=
router.post('/',    c.create);
router.put('/:id',  c.update);

module.exports = router;