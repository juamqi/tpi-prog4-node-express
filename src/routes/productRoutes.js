//sebastian panozzo
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middlewares/authMiddleware');
const { isSupplier } = require('../middlewares/roleCheckMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { uploadOptionalImage, uploadImage } = require('../middlewares/uploadImageMiddleware');
const {
  createProductSchema,
  updateProductSchema,
  searchProductsSchema
} = require('../validators/productValidator');

router.get(
  '/',
  productController.listProducts
);

router.get(
  '/search',
  productController.searchProducts
);

router.get(
  '/top-rated',
  productController.getTopRatedProducts
);

router.get(
  '/recent',
  productController.getRecentProducts
);

router.get(
  '/by-supplier/:supplierId',
  searchController.getProductsBySupplier
);

router.get(
  '/:id/related',
  searchController.getRelatedProducts
);

router.get(
  '/:id',
  productController.getProductById
);

router.post(
  '/',
  authenticate,
  isSupplier,
  uploadOptionalImage,
  validate(createProductSchema),
  productController.createProduct
);

router.put(
  '/:id',
  authenticate,
  isSupplier,
  validate(updateProductSchema),
  productController.updateProduct
);

router.put(
  '/:id/photo',
  authenticate,
  isSupplier,
  uploadImage,
  productController.updateProductPhoto
);
router.delete(
  '/:id',
  authenticate,
  isSupplier,
  productController.deleteProduct
);

module.exports = router;