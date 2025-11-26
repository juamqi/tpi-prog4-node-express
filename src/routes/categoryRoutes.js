const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { validateParams, validateQuery } = require('../middlewares/validatorMiddleware');
const { 
  getCategoryByIdSchema, 
  listCategoriesSchema,
  getCategoryProductsSchema,
  getPopularCategoriesSchema,
  getCategorySuppliersSchema
} = require('../validators/categoryValidator');

router.get('/popular', validateQuery(getPopularCategoriesSchema), categoryController.getPopularCategories);
router.get('/', validateQuery(listCategoriesSchema), categoryController.listCategories);
router.get('/:id', validateParams(getCategoryByIdSchema), categoryController.getCategoryById);
router.get('/:id/products', validateParams(getCategoryProductsSchema), categoryController.getCategoryProducts);
router.get('/:id/suppliers', validateParams(getCategorySuppliersSchema), categoryController.getCategorySuppliers);

module.exports = router;