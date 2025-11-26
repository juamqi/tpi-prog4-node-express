//sebastian panozzo
const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede superar los 100 caracteres',
      'any.required': 'El nombre es obligatorio'
    }),
  
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede superar los 500 caracteres'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      'number.positive': 'El precio debe ser un número positivo',
      'number.base': 'El precio debe ser un número válido',
      'any.required': 'El precio es obligatorio'
    }),
  
  categoryId: Joi.string()
    .required()
    .messages({
      'any.required': 'La categoría es obligatoria'
    })
});

const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 3 caracteres',
      'string.max': 'El nombre no puede superar los 100 caracteres'
    }),
  
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La descripción no puede superar los 500 caracteres'
    }),
  
  price: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'El precio debe ser un número positivo',
      'number.base': 'El precio debe ser un número válido'
    }),
  
  categoryId: Joi.string()
    .optional()
    .messages({
      'string.base': 'La categoría debe ser un ID válido'
    })
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

const searchProductsSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .optional()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres'
    }),
  
  categoryId: Joi.string()
    .optional()
    .messages({
      'string.base': 'El ID de categoría debe ser válido'
    }),
  
  supplierId: Joi.string()
    .optional()
    .messages({
      'string.base': 'El ID de proveedor debe ser válido'
    }),
  
  minPrice: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'El precio mínimo no puede ser negativo',
      'number.base': 'El precio mínimo debe ser un número válido'
    }),
  
  maxPrice: Joi.number()
    .min(0)
    .optional()
    .when('minPrice', {
      is: Joi.exist(),
      then: Joi.number().min(Joi.ref('minPrice')).messages({
        'number.min': 'El precio máximo debe ser mayor o igual al precio mínimo'
      })
    })
    .messages({
      'number.min': 'El precio máximo no puede ser negativo',
      'number.base': 'El precio máximo debe ser un número válido'
    }),
  
  minRating: Joi.number()
    .min(0)
    .max(5)
    .optional()
    .messages({
      'number.min': 'La puntuación mínima debe ser al menos 0',
      'number.max': 'La puntuación mínima no puede ser mayor a 5',
      'number.base': 'La puntuación mínima debe ser un número válido'
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

const productIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'any.required': 'El ID del producto es obligatorio',
      'string.base': 'El ID del producto debe ser válido'
    })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  searchProductsSchema,
  productIdSchema
};