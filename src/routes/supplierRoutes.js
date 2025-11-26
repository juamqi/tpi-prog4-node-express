const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, validateParams, validateQuery } = require('../middlewares/validatorMiddleware');
const { 
  updateProfileSchema, 
  updatePhotoSchema, 
  getSupplierByIdSchema, 
  listSuppliersSchema,
  getSupplierProductsSchema,
  getSupplierStatsSchema,
  getFavoritesByProductSchema,
  getSupplierReviewsSchema,
  getSupplierResellersSchema
} = require('../validators/supplierValidator');

router.get('/profile', authenticate, supplierController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), supplierController.updateProfile);
router.put('/profile/photo', authenticate, validate(updatePhotoSchema), supplierController.updatePhoto);
router.get('/', validateQuery(listSuppliersSchema), supplierController.listSuppliers);
router.get('/products/:productId/favorites', authenticate, validateParams(getFavoritesByProductSchema), supplierController.getFavoritesByProduct);
router.get('/:id', validateParams(getSupplierByIdSchema), supplierController.getSupplierById);
router.get('/:id/products', validateParams(getSupplierProductsSchema), supplierController.getSupplierProducts);
router.get('/:id/stats', validateParams(getSupplierStatsSchema), supplierController.getSupplierStats);
router.get('/:id/reviews', validateParams(getSupplierReviewsSchema), supplierController.getSupplierReviews);
router.get('/:id/resellers', validateParams(getSupplierResellersSchema), supplierController.getSupplierResellers);

module.exports = router;