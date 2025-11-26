const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/", authenticate, notificationController.getMyNotifications);

router.put("/:id/read", authenticate, notificationController.markAsRead);

router.delete("/:id", authenticate, notificationController.deleteNotification);

module.exports = router;