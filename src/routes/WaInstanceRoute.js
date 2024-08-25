// LOAD LIBS
const router = require("express").Router();

// CONTROLLERS
const WaInstanceController = require("../controllers/WaInstanceController");

// MIDDLEWARES
const authMiddleware = require("../middlewares/authMiddleware");

// VALIDATORS
const { mapperV1 } = require("../validators/ErrorsMapper");
const { blastRules } = require("../validators/WaInstanceRules");

// ROUTE DEFINE
router.get(
  "/wa_instance/all",
  authMiddleware(["superadmin", "client"]),
  WaInstanceController.getAll
);
router.post(
  "/wa_instance/create",
  authMiddleware(["superadmin", "client"]),
  WaInstanceController.create
);
router.post(
  "/wa_instance/blast",
  authMiddleware(["superadmin", "client"]),
  blastRules(),
  mapperV1,
  WaInstanceController.blast
);
router.delete(
  "/wa_instance/delete/:wa_instance_id",
  authMiddleware(["superadmin", "client"]),
  WaInstanceController.delete
);

module.exports = router;
