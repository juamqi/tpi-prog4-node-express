const Joi = require("joi");

const advancedSearchSchema = Joi.object({
  query: Joi.string().min(2).required(),
  searchIn: Joi.string()
    .valid("products", "suppliers", "both")
    .default("both"),
  "filters[categoryId]": Joi.string().optional(),
  "filters[province]": Joi.string().optional(),
  "filters[minPrice]": Joi.number().min(0).optional(),
  "filters[maxPrice]": Joi.number().min(0).optional(),
  "filters[minRating]": Joi.number().min(0).max(5).optional(),
});

module.exports = {
  advancedSearchSchema,
};