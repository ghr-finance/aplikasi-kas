const express = require("express");
const router = express.Router();
const TarifIuranController = require("../controllers/TarifIuranController");

router.get("/", TarifIuranController.index);
router.get("/:status", TarifIuranController.show);
router.put("/:status", TarifIuranController.update);

module.exports = router;
