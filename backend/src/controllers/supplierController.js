const supplierModel = require('../models/supplierModel');
const { badRequest, notFound, conflict, isNonEmptyString } = require('../middleware/validate');
const { PROVINCES } = require('../utils/constants');

function validateSupplierBody(body) {
  const required = ['business_name', 'contact_person', 'phone', 'province', 'address'];
  for (const field of required) {
    if (!isNonEmptyString(body[field])) {
      return `Field "${field}" is required.`;
    }
  }
  if (!PROVINCES.includes(body.province)) {
    return `Invalid province. Allowed: ${PROVINCES.join(', ')}`;
  }
  return null;
}

async function list(req, res, next) {
  try {
    const suppliers = await supplierModel.findAll();
    res.json({ success: true, data: suppliers });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const supplier = await supplierModel.findById(req.params.id);
    if (!supplier) return notFound(res, 'Supplier not found');
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const error = validateSupplierBody(req.body);
    if (error) return badRequest(res, error);
    const supplier = await supplierModel.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const existing = await supplierModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Supplier not found');
    const error = validateSupplierBody(req.body);
    if (error) return badRequest(res, error);
    const supplier = await supplierModel.update(req.params.id, req.body);
    res.json({ success: true, data: supplier });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const existing = await supplierModel.findById(req.params.id);
    if (!existing) return notFound(res, 'Supplier not found');
    const inUse = await supplierModel.hasPurchases(req.params.id);
    if (inUse) {
      return conflict(res, 'Cannot delete supplier — they have existing purchases.');
    }
    await supplierModel.remove(req.params.id);
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove };