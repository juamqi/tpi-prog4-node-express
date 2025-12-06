//sebastian panozzo
const Joi = require('joi');

const addFavoriteSchema = Joi.object({
  productId: Joi.string()
    .required()
    .messages({
      'any.required': 'El ID del producto es obligatorio',
      'string.base': 'El ID del producto debe ser válido'
    })
});

const markupSchema = Joi.object({
  markupType: Joi.string()
    .valid('fixed', 'percentage', 'default')
    .required()
    .messages({
      'any.required': 'El tipo de markup es obligatorio',
      'any.only': 'El tipo de markup debe ser: fixed, percentage o default'
    }),
  
  markupValue: Joi.number()
    .min(0)
    .when('markupType', {
      is: 'default',
      then: Joi.forbidden(),
      otherwise: Joi.required()
    })
    .messages({
      'any.required': 'El valor de markup es obligatorio cuando el tipo no es "default"',
      'number.min': 'El valor de markup no puede ser negativo',
      'number.base': 'El valor de markup debe ser un número válido',
      'any.unknown': 'No se debe especificar markupValue cuando el tipo es "default"',
      'any.forbidden': 'No se debe especificar markupValue cuando el tipo es "default"'
    })
});

const favoriteProductIdSchema = Joi.object({
  productId: Joi.string()
    .required()
    .messages({
      'any.required': 'El ID del producto es obligatorio',
      'string.base': 'El ID del producto debe ser válido'
    })
});

const favoritesFilterSchema = Joi.object({
  categoryId: Joi.string()
    .optional()
    .messages({
      'string.base': 'El ID de categoría debe ser válido'
    }),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.min': 'La página debe ser al menos 1',
      'number.base': 'La página debe ser un número válido'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .optional()
    .messages({
      'number.min': 'El límite debe ser al menos 1',
      'number.max': 'El límite no puede ser mayor a 100',
      'number.base': 'El límite debe ser un número válido'
    })
});

module.exports = {
  addFavoriteSchema,
  markupSchema,
  favoriteProductIdSchema,
  favoritesFilterSchema
};