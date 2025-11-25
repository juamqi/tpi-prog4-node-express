const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow('').messages({
    'string.pattern.base': 'El teléfono debe contener solo numeros y simbolos validos'
  }),
  website: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'El sitio web debe ser una URL valida'
  }),
  photoURL: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'La URL de la foto debe ser valida'
  })
}).min(1).messages({
  'object.min': 'Debes proporcionar al menos un campo para actualizar'
});

const updatePhotoSchema = Joi.object({
  photoURL: Joi.string().uri().required().messages({
    'string.uri': 'La URL de la foto debe ser valida',
    'any.required': 'La URL de la foto es obligatoria'
  })
});
const getResellerByIdSchema = Joi.object({
  id: Joi.string().required().messages({
    'any.required': 'El ID del revendedor es obligatorio',
    'string.empty': 'El ID del revendedor no puede estar vaco'
  })
});
const listResellersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional().messages({
    'number.base': 'La pagina debe ser un numero',
    'number.min': 'La pagina debe ser mayor a 0'
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).optional().messages({
    'number.base': 'El limite debe ser un número',
    'number.min': 'El limite debe ser mayor a 0',
    'number.max': 'El limite máximo es 50'
  })
});
module.exports = {
  updateProfileSchema,
  updatePhotoSchema,
  getResellerByIdSchema,
  listResellersSchema
};