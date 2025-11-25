/**
 * Rutas de Favoritos
 * 
 * Define todas las rutas HTTP para operaciones con favoritos
 * Todas las rutas requieren autenticación y rol de revendedor
 */

const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middlewares/authMiddleware');
const { isReseller } = require('../middlewares/roleCheckMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const {
  addFavoriteSchema,
  markupSchema,
  favoritesFilterSchema
} = require('../validators/favoriteValidator');

/**
 * Todas las rutas requieren autenticación y rol de revendedor
 */
router.use(authenticate);
router.use(isReseller);

/**
 * Rutas de favoritos
 */

// POST /favorites - Agregar producto a favoritos
router.post(
  '/',
  validate(addFavoriteSchema),
  favoriteController.addFavorite
);

// GET /favorites - Ver mis favoritos
router.get(
  '/',
  favoriteController.getFavorites
);

// GET /favorites/by-category - Favoritos agrupados por categoría
router.get(
  '/by-category',
  favoriteController.getFavoritesByCategory
);

// GET /favorites/:productId/markup - Ver configuración de markup
router.get(
  '/:productId/markup',
  favoriteController.getProductMarkup
);

// PUT /favorites/:productId/markup - Configurar markup específico
router.put(
  '/:productId/markup',
  validate(markupSchema),
  favoriteController.setProductMarkup
);

// DELETE /favorites/:productId - Quitar de favoritos
router.delete(
  '/:productId',
  favoriteController.removeFavorite
);

module.exports = router;