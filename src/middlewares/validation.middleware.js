exports.validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "Error de validación",
        details: error.details.map((d) => d.message),
      });
    }

    req.body = value;
    next();
  };
};

exports.validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "Error de validación en query params",
        details: error.details.map((d) => d.message),
      });
    }

    req.query = value;
    next();
  };
};

exports.validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: "Error de validación en los params",
        details: error.details.map((d) => d.message),
      });
    }

    req.params = value;
    next();
  };
};