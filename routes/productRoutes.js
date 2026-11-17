const express = require("express");
const router = express.Router();
const c = require("../controllers/productController");
const { validateObjectId, validateBody } = require("../middleware/validate");

// Static routes MUST come before "/:id" or they'd be treated as IDs
router.get("/low-stock", c.getLowStock);
router.get("/summary", c.getCategorySummary);

router.route("/")
  .get(c.getProducts)
  .post(validateBody, c.createProduct);

router.patch("/:id/stock", validateObjectId, validateBody, c.adjustStock);

router.route("/:id")
  .get(validateObjectId, c.getProductById)
  .put(validateObjectId, validateBody, c.updateProduct)
  .delete(validateObjectId, c.deleteProduct);

module.exports = router;
