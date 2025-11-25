const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validatorMiddleware');
const { registerResellerSchema, registerSupplierSchema, loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators/authValidator');
const { authenticate } = require('../middlewares/authMiddleware');

router.post(
  '/register/reseller',
  validate(registerResellerSchema),
  authController.registerReseller
);
router.post(
  '/register/supplier',
  validate(registerSupplierSchema),
  authController.registerSupplier
);
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);
router.post(
  '/logout',
  authenticate,
  authController.logout
);
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;