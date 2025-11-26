//sebastian panozzo
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

router.use(authenticate);
router.use(isReseller);

router.post(
  '/',
  validate(addFavoriteSchema),
  favoriteController.addFavorite
);

router.get(
  '/',
  favoriteController.getFavorites
);

router.get(
  '/by-category',
  favoriteController.getFavoritesByCategory
);

router.get(
  '/:productId/markup',
  favoriteController.getProductMarkup
);

router.put(
  '/:productId/markup',
  validate(markupSchema),
  favoriteController.setProductMarkup
);
router.get(
  '/:productId',
  favoriteController.getFavoriteDetail
);

router.delete(
  '/:productId',
  favoriteController.removeFavorite
);

module.exports = router;