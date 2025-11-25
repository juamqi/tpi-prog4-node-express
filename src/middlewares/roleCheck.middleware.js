exports.roleCheck = (requiredRole) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" });
      }

      if (req.user.userType !== requiredRole) {
        return res.status(403).json({
          error: `Acceso denegado. Este endpoint requiere rol: ${requiredRole}`,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};