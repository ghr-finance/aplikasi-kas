const express = require("express");
const router = express.Router();
const EventAnggaranController = require("../controllers/EventAnggaranController");

router.get("/", EventAnggaranController.index);
router.get("/:id", EventAnggaranController.show);
router.post("/", EventAnggaranController.store);
router.put("/:id", EventAnggaranController.update);
router.delete("/:id", EventAnggaranController.destroy);

module.exports = router;
