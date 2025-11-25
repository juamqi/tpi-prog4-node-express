const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate } = require('../middlewares/validatorMiddleware');
const { registerResellerSchema } = require('../validators/authValidator');

router.post(
  '/register/reseller',
  validate(registerResellerSchema),
  authController.registerReseller
);

module.exports = router;