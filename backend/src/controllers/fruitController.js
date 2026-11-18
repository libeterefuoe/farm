const fruitModel = require('../models/fruitModel');
const { badRequest, notFound, conflict, isNonEmptyString, isValidFruitStatus } = require('../middleware/validate');

function validateBody(body) {
  if (!isNonEmptyString(body.fruit_name)) return 'Field "fruit_name" is required.';
  if (body.status && !isValidFruitStatus(body.status)) {
    return 'Field "status" must be ACTIVE or INACTIVE.';
  }
  return null;
}

async function list(req, res, next) {
  try {
    const fruits = await fruitModel.findAll();
    res.json({ success: true, data: fruits });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const error = validateBody(req.body);
    if (error) return badRequest(res, error);

    const existing = await fruitModel.findByName(req.body.fruit_name);
    if (existing) return conflict(res, 'A fruit with that name already exists.');

    const fruit = await fruitModel.create({
      fruit_name: req.body.fruit_name,
      description: req.body.description,
      status: req.body.status || 'ACTIVE'
    });
    res.status(201).json({ success: true, data: fruit });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const existing = await fruitModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Fruit not found');

    const error = validateBody(req.body);
    if (error) return badRequest(res, error);

    const updated = await fruitModel.update(req.params.id, {
      fruit_name: req.body.fruit_name,
      description: req.body.description,
      status: req.body.status || existing.status
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

module.exports = { list, create, update };