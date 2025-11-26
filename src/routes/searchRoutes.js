const express = require("express");
const router = express.Router();

const searchController = require("../controllers/searchController");
const { validateQuery } = require("../middlewares/validatorMiddleware");
const { advancedSearchSchema } = require("../validators/searchValidator");
const { authenticate } = require("../middlewares/authMiddleware");
const { isReseller } = require("../middlewares/roleCheckMiddleware");

router.get("/advanced", validateQuery(advancedSearchSchema), searchController.advancedSearch);

router.get("/filters", searchController.getSearchFilters);

router.get("/products/:id/related", searchController.getRelatedProducts);

router.get("/products/by-supplier/:supplierId", searchController.getProductsBySupplier);

router.get(
  "/resellers/:id/favorite-suppliers",
  authenticate,
  isReseller,
  searchController.getFavoriteSuppliers
);

module.exports = router;