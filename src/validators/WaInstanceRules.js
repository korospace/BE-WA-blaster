// LOAD LIBS
const { body } = require("express-validator");

/**
 * Create Rules
 * ---------------------
 */
// const VALID_STATUSES = ["connected", "disconnected", "connecting", "pending"];
// const createRules = (loginInfo) => {
//   return [
//     body("phone_number").notEmpty().withMessage("Phone Number is required"),
//     body("status")
//       .notEmpty()
//       .withMessage("Status is required")
//       .isIn(VALID_STATUSES)
//       .withMessage(
//         `Status must be one of the following values: ${VALID_STATUSES.join(
//           ", "
//         )}`
//       ),
//   ];
// };

const blastRules = (loginInfo) => {
  return [body("text").notEmpty().withMessage("Text is required")];
};

module.exports = {
  // createRules,
  blastRules,
};
