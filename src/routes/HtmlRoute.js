// LOAD LIBS
const router = require("express").Router();
const path = require("path");

// ROUTE DEFINE
router.get("/playground", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/playground.html"));
});
router.get("/playground2", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/playground2.html"));
});
router.get("/playground3", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/playground3.html"));
});

module.exports = router;
