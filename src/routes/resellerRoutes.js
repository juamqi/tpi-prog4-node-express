const express = require('express');
const router = express.Router();
const resellerController = require('../controllers/resellerController');
const { authenticate } = require('../middlewares/authMiddleware');

router.get('/profile', authenticate, resellerController.getProfile);

module.exports = router;