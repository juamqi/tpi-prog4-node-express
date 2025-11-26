const Joi = require("joi");

const createReviewSchema = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(10).max(500).required(),
});

const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string().min(10).max(500),
}).min(1);

module.exports = {
  createReviewSchema,
  updateReviewSchema,
};