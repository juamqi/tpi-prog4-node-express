const express = require('express');
const router = express.Router();
const resellerController = require('../controllers/resellerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate, validateParams, validateQuery } = require('../middlewares/validatorMiddleware');
const { updateProfileSchema, updatePhotoSchema, getResellerByIdSchema, listResellersSchema } = require('../validators/resellerValidator');

router.get('/profile', authenticate, resellerController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), resellerController.updateProfile);
router.put('/profile/photo', authenticate, validate(updatePhotoSchema), resellerController.updatePhoto);
router.get('/', validateQuery(listResellersSchema), resellerController.listResellers);
router.get('/:id', validateParams(getResellerByIdSchema), resellerController.getResellerById);
router.put('/account/deactivate', authenticate, resellerController.deactivateAccount);



module.exports = router;