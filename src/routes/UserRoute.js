// LOAD LIBS
const router = require("express").Router();

// CONTROLLERS
const UserController = require("../controllers/UserController");

// MIDDLEWARES
const authMiddleware = require('../middlewares/authMiddleware');

// ROUTE DEFINE
router.get("/user/list", authMiddleware(['superadmin','komisaris','blabla']), UserController.getAll);

module.exports = router;