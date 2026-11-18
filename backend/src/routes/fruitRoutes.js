const express = require('express');
const router = express.Router();
const c = require('../controllers/fruitController');

router.get('/',    c.list);
router.post('/',   c.create);
router.put('/:id', c.update);

module.exports = router;