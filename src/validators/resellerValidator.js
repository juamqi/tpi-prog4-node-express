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

module.exports = {
  updateProfileSchema
};