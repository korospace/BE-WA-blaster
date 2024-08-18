// LOAD LIBS
const { body } = require('express-validator');
// HELPERS
const { formatResponse } = require('../helpers/utils')

/**
 * Create Rules
 * ---------------------
 */
const createRules = (loginInfo) => {
  return [
    body('number')
        .notEmpty()
        .withMessage('Number is required')
  ]
}

/**
 * Update Rules
 * ---------------------
 */
const updateRules = () => {
  return [
    body('wa_number_id')
        .notEmpty()
        .withMessage('WA Number Id is required'),
    body('number')
        .notEmpty()
        .withMessage('Number is required')
  ]
}

/**
 * Import Rules
 * ---------------------
 */
const importXlsxRule = (req, res, next) => {
  if (!req.file || req.file.fieldname !== 'file_xlsx') {
    return formatResponse(res, 400, 'invalid request', {file_xlsx: 'File with key "file_xlsx" is required'})
  }

  next();
};

module.exports = {
  createRules,
  updateRules,
  importXlsxRule
};
