const express = require('express');
const router = express.Router();
const resellerController = require('../controllers/resellerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validatorMiddleware');
const { updateProfileSchema, updatePhotoSchema } = require('../validators/resellerValidator');

router.get('/profile', authenticate, resellerController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), resellerController.updateProfile);
router.put('/profile/photo', authenticate, validate(updatePhotoSchema), resellerController.updatePhoto);


module.exports = router;