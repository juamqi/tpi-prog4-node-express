const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validatorMiddleware');
const { registerResellerSchema, registerSupplierSchema, loginSchema } = require('../validators/authValidator');

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

module.exports = router;