// LOAD LIBS
const { body } = require("express-validator");

/**
 * Create Rules
 * ---------------------
 */
const createRules = (loginInfo) => {
  return [body("text").notEmpty().withMessage("Text is required")];
};

/**
 * Update Rules
 * ---------------------
 */
const updateRules = () => {
  return [
    body("wa_campaign_id").notEmpty().withMessage("WA Campaign Id is required"),
    body("text").notEmpty().withMessage("text is required"),
  ];
};

module.exports = {
  createRules,
  updateRules,
};
