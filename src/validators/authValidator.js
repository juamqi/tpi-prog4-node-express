const Joi = require('joi');

const registerResellerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email debe ser valido',
    'any.required': 'El email es obligatorio'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener mayusculas, minusculas y numeros',
      'any.required': 'La contraseña es obligatoria'
    }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El nombre debe tener al menos 2 caracteres',
    'any.required': 'El nombre es obligatorio'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'El apellido debe tener al menos 2 caracteres',
    'any.required': 'El apellido es obligatorio'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).optional().allow('').messages({
    'string.pattern.base': 'El teléfono debe contener solo numeros y simbolos validos'
  }),
  website: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'El sitio web debe ser una URL valida'
  })
});

module.exports = {
  registerResellerSchema
};