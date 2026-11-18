const vendorModel = require('../models/vendorModel');
const { badRequest, notFound, isNonEmptyString, isValidDate } = require('../middleware/validate');

function validateBody(body) {
  const required = ['vendor_name', 'phone_number', 'location', 'registration_date'];
  for (const field of required) {
    if (!isNonEmptyString(body[field])) return `Field "${field}" is required.`;
  }
  if (!isValidDate(body.registration_date)) return 'Field "registration_date" is invalid.';
  return null;
}

async function list(req, res, next) {
  try {
    const search = req.query.search;
    let vendors;
    if (search && search.trim()) {
      vendors = await vendorModel.searchByNameOrPhone(search.trim());
    } else {
      vendors = await vendorModel.findAllWithBalance();
    }
    res.json({ success: true, data: vendors });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const error = validateBody(req.body);
    if (error) return badRequest(res, error);
    const vendor = await vendorModel.create(req.body);
    res.status(201).json({ success: true, data: vendor });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const existing = await vendorModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Vendor not found');
    const error = validateBody(req.body);
    if (error) return badRequest(res, error);
    const updated = await vendorModel.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

module.exports = { list, create, update };