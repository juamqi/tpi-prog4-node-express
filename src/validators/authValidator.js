//soria nicolas
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

const registerSupplierSchema = Joi.object({
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
  companyName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'El nombre de la empresa debe tener al menos 2 caracteres',
    'any.required': 'El nombre de la empresa es obligatorio'
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required().messages({
    'string.pattern.base': 'El telefono debe contener solo números y simbolos validos',
    'any.required': 'El telefono es obligatorio'
  }),
  website: Joi.string().uri().optional().allow('').messages({
    'string.uri': 'El sitio web debe ser una URL valida'
  }),
  address: Joi.object({
    province: Joi.string().required().messages({
      'any.required': 'La provincia es obligatoria'
    }),
    city: Joi.string().required().messages({
      'any.required': 'La ciudad es obligatoria'
    }),
    street: Joi.string().required().messages({
      'any.required': 'La calle es obligatoria'
    }),
    number: Joi.string().required().messages({
      'any.required': 'El numero es obligatorio'
    })
  }).required().messages({
    'any.required': 'La direccion es obligatoria'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email debe ser valido',
    'any.required': 'El email es obligatorio'
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es obligatoria'
  })
});
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'El refresh token es obligatorio'
  })
});
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'El email debe ser valido',
    'any.required': 'El email es obligatorio'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'El token es obligatorio'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener mayusculas, minusculas y numeros',
      'any.required': 'La nueva contraseña es obligatoria'
    })
});


module.exports = {
  registerResellerSchema,
  registerSupplierSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  forgotPasswordSchema
};