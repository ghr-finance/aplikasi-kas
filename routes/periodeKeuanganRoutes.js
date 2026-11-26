const express = require("express");
const router = express.Router();
const PeriodeKeuanganController = require("../controllers/PeriodeKeuanganController");

router.get("/", PeriodeKeuanganController.index);
router.get("/aktif", PeriodeKeuanganController.getActive);
router.get("/:id", PeriodeKeuanganController.show);
router.post("/", PeriodeKeuanganController.store);
router.put("/:id", PeriodeKeuanganController.update);
router.patch("/:id/aktif", PeriodeKeuanganController.setActive);
router.delete("/:id", PeriodeKeuanganController.destroy);

module.exports = router;
