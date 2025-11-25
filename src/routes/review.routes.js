const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { roleCheck } = require("../middlewares/roleCheck.middleware");
const {
  validateBody,
} = require("../middlewares/validation.middleware");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validators/review.validator");

router.post(
  "/",
  authMiddleware,
  roleCheck("reseller"),
  validateBody(createReviewSchema),
  reviewController.createReview
);

router.get("/product/:productId", reviewController.getReviewsByProduct);

router.get("/:id", reviewController.getReviewById);

router.put(
  "/:id",
  authMiddleware,
  roleCheck("reseller"),
  validateBody(updateReviewSchema),
  reviewController.updateReview
);

router.delete(
  "/:id",
  authMiddleware,
  roleCheck("reseller"),
  reviewController.deleteReview
);

router.get(
  "/user/me",
  authMiddleware,
  roleCheck("reseller"),
  reviewController.getMyReviews
);

router.post(
  "/:id/like",
  authMiddleware,
  reviewController.likeReview
);

module.exports = router;