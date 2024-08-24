// LOAD LIBS
const router = require("express").Router();

// CONTROLLERS
const WaCampaignController = require("../controllers/WaCampaignController");

// MIDDLEWARES
const authMiddleware = require("../middlewares/authMiddleware");

// VALIDATORS
const { mapperV1 } = require("../validators/ErrorsMapper");
const { createRules, updateRules } = require("../validators/WaCampaignRules");

// ROUTE DEFINE
router.get(
  "/wa_campaign/all",
  authMiddleware(["superadmin", "client"]),
  WaCampaignController.getAll
);
router.post(
  "/wa_campaign/create",
  authMiddleware(["superadmin", "client"]),
  createRules(),
  mapperV1,
  WaCampaignController.create
);
router.put(
  "/wa_campaign/update",
  authMiddleware(["superadmin", "client"]),
  updateRules(),
  mapperV1,
  WaCampaignController.update
);
router.delete(
  "/wa_campaign/delete/:wa_campaign_id",
  authMiddleware(["superadmin", "client"]),
  WaCampaignController.delete
);

module.exports = router;
