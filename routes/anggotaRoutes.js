const express = require("express");
const router = express.Router();
const Controller = require("../controllers/AnggotaController");

router.get("/", Controller.index);
router.post("/", Controller.store);
router.get("/:id", Controller.show);
router.put("/:id", Controller.update);
router.delete("/:id", Controller.destroy);

module.exports = router;
