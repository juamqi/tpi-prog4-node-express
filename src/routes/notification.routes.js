const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, notificationController.getMyNotifications);

router.put("/:id/read", authMiddleware, notificationController.markAsRead);

router.delete("/:id", authMiddleware, notificationController.deleteNotification);

module.exports = router;