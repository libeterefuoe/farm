// Central error handler.
// Logs the error and returns meaningful JSON.
// IMPORTANT: If a controller throws, this responds with 500
// instead of letting Node crash.

module.exports = (err, req, res, next) => {
  console.error('[error]', err);

  // MySQL-specific hints: duplicate key etc.
  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record — a unique constraint was violated.'
    });
  }
  if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist (foreign key constraint).'
    });
  }
  if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete — record is referenced by other rows.'
    });
  }
  if (err && err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable'
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};