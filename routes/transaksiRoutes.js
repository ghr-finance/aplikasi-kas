
const express = require("express");
const router = express.Router();

const Controller =
  require("../controllers/TransaksiController");

router.get("/", Controller.index);

router.get("/saldo", Controller.saldo);

router.post("/", Controller.store);

router.get("/:id", Controller.show);

router.put("/:id", Controller.update);

router.delete("/:id", Controller.destroy);

module.exports = router;
