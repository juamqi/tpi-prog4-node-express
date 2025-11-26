const Joi = require('joi');

const updateProfileSchema = Joi.object({
  companyName: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/),
  website: Joi.string().uri().allow(''),
  address: Joi.object({
    province: Joi.string().max(100),
    city: Joi.string().max(100),
    street: Joi.string().max(200),
    number: Joi.string().max(20)
  })
}).min(1);

const updatePhotoSchema = Joi.object({
  photoURL: Joi.string().uri().required()
});

const getSupplierByIdSchema = Joi.object({
  id: Joi.string().required()
});

const listSuppliersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  province: Joi.string().allow(''),
  city: Joi.string().allow(''),
  minRating: Joi.number().min(0).max(5)
});

const getSupplierProductsSchema = Joi.object({
  id: Joi.string().required()
});

const getSupplierStatsSchema = Joi.object({
  id: Joi.string().required()
});

const getFavoritesByProductSchema = Joi.object({
  productId: Joi.string().required()
});

const getSupplierReviewsSchema = Joi.object({
  id: Joi.string().required()
});

const getSupplierResellersSchema = Joi.object({
  id: Joi.string().required()
});

module.exports = {
  updateProfileSchema,
  updatePhotoSchema,
  getSupplierByIdSchema,
  listSuppliersSchema,
  getSupplierProductsSchema,
  getSupplierStatsSchema,
  getFavoritesByProductSchema,
  getSupplierReviewsSchema,
  getSupplierResellersSchema
};
