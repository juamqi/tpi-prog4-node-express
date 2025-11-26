const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const { authenticate } = require("../middlewares/authMiddleware");
const { isReseller } = require("../middlewares/roleCheckMiddleware");
const { validate } = require("../middlewares/validatorMiddleware");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../validators/reviewValidator");

router.post(
  "/",
  authenticate,
  isReseller,
  validate(createReviewSchema),
  reviewController.createReview
);

router.get("/product/:productId", reviewController.getReviewsByProduct);

router.get(
  "/user/me",
  authenticate,
  isReseller,
  reviewController.getMyReviews
);

router.post(
  "/:id/like",
  authenticate,
  reviewController.likeReview
);

router.get("/:id", reviewController.getReviewById);

router.put(
  "/:id",
  authenticate,
  isReseller,
  validate(updateReviewSchema),
  reviewController.updateReview
);

router.delete(
  "/:id",
  authenticate,
  isReseller,
  reviewController.deleteReview
);

module.exports = router;