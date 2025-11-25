/**
 * Rutas de Productos
 * 
 * Define todas las rutas HTTP para operaciones con productos
 * Incluye middlewares de autenticación, validación y manejo de archivos
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middlewares/authMiddleware');
const { isSupplier } = require('../middlewares/roleCheckMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { uploadOptionalImage, uploadImage } = require('../middlewares/uploadImageMiddleware');
const {
  createProductSchema,
  updateProductSchema,
  searchProductsSchema
} = require('../validators/productValidator');

/**
 * Rutas públicas (no requieren autenticación)
 */

// GET /products - Listar productos con filtros
router.get(
  '/',
  productController.listProducts
);

// GET /products/search - Buscar productos por nombre
router.get(
  '/search',
  productController.searchProducts
);

// GET /products/top-rated - Productos mejor valorados
router.get(
  '/top-rated',
  productController.getTopRatedProducts
);

// GET /products/recent - Productos más recientes
router.get(
  '/recent',
  productController.getRecentProducts
);

// GET /products/:id - Detalle de un producto
router.get(
  '/:id',
  productController.getProductById
);

/**
 * Rutas protegidas (requieren autenticación)
 */

// POST /products - Crear producto (solo proveedores)
router.post(
  '/',
  authenticate,
  isSupplier,
  uploadOptionalImage,
  validate(createProductSchema),
  productController.createProduct
);

// PUT /products/:id - Actualizar producto (solo el proveedor dueño)
router.put(
  '/:id',
  authenticate,
  isSupplier,
  validate(updateProductSchema),
  productController.updateProduct
);

// PUT /products/:id/photo - Actualizar foto del producto (solo el proveedor dueño)
router.put(
  '/:id/photo',
  authenticate,
  isSupplier,
  uploadImage,
  productController.updateProductPhoto
);

// DELETE /products/:id - Eliminar producto (solo el proveedor dueño)
router.delete(
  '/:id',
  authenticate,
  isSupplier,
  productController.deleteProduct
);

module.exports = router;