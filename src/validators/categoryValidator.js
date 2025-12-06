const Joi = require('joi');

const getCategoryByIdSchema = Joi.object({
  id: Joi.string().required()
});

const listCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const getCategoryProductsSchema = Joi.object({
  id: Joi.string().required()
});

const getPopularCategoriesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(20).default(10)
});

const getCategorySuppliersSchema = Joi.object({
  id: Joi.string().required()
});

module.exports = {
  getCategoryByIdSchema,
  listCategoriesSchema,
  getCategoryProductsSchema,
  getPopularCategoriesSchema,
  getCategorySuppliersSchema
};