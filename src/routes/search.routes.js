const express = require("express");
const router = express.Router();

const searchController = require("../controllers/search.controller");
const { validateQuery } = require("../middlewares/validation.middleware");
const { advancedSearchSchema } = require("../validators/search.validator");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/advanced", validateQuery(advancedSearchSchema), searchController.advancedSearch);

router.get("/filters", searchController.getSearchFilters);

router.get("/products/:id/related", searchController.getRelatedProducts);

router.get("/products/by-supplier/:supplierId", searchController.getProductsBySupplier);

router.get("/resellers/:id/favorite-suppliers", authMiddleware, searchController.getFavoriteSuppliers);

module.exports = router;