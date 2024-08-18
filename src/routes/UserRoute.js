// LOAD LIBS
const router = require("express").Router();

// CONTROLLERS
const UserController = require("../controllers/UserController");

// MIDDLEWARES
const authMiddleware = require('../middlewares/authMiddleware');

// VALIDATORS
const { mapperV1 } = require('../validators/ErrorsMapper');
const { createRules,updateRules } = require('../validators/UserRules');

// ROUTE DEFINE
router.get("/user/all", authMiddleware(['superadmin']), UserController.getAll);
router.post(
  "/user/create", 
  authMiddleware(['superadmin']),  
  createRules(),                   
  mapperV1,                        
  UserController.create            
);
router.put(
  "/user/update", 
  authMiddleware(['superadmin']),  
  updateRules(),                   
  mapperV1,                        
  UserController.update            
);
router.delete("/user/delete/:user_id", authMiddleware(['superadmin']), UserController.delete);

module.exports = router;