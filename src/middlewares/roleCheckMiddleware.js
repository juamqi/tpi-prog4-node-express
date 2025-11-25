/**
 * Middleware de verificación de roles
 * 
 * Verifica que el usuario autenticado tenga el rol necesario
 * para acceder a un endpoint específico.
 * 
 * Debe ser usado después del middleware authenticate()
 */

/**
 * Verifica que el usuario tenga uno de los roles permitidos
 * 
 * @param {string[]} allowedRoles - Array de roles permitidos ('reseller', 'supplier')
 * @returns {Function} Middleware de Express
 * 
 * @example
 * router.post('/products', authenticate, checkRole(['supplier']), controller.create)
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Verificar que el usuario tenga un rol asignado
    if (!req.user.userType) {
      return res.status(403).json({
        success: false,
        message: 'Rol de usuario no definido'
      });
    }

    // Verificar que el rol del usuario esté en la lista de roles permitidos
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`
      });
    }

    // Usuario tiene permisos, continuar
    next();
  };
};

/**
 * Middleware específico para verificar que el usuario sea un proveedor
 * Atajo para checkRole(['supplier'])
 */
const isSupplier = checkRole(['supplier']);

/**
 * Middleware específico para verificar que el usuario sea un revendedor
 * Atajo para checkRole(['reseller'])
 */
const isReseller = checkRole(['reseller']);

/**
 * Middleware para verificar que el usuario sea el dueño del recurso
 * 
 * @param {string} paramName - Nombre del parámetro en req.params que contiene el ID del dueño
 * @returns {Function} Middleware de Express
 * 
 * @example
 * router.put('/products/:id', authenticate, isOwner('supplierId'), controller.update)
 */
const isOwner = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = req.params[paramName] || req.body[paramName];
    const currentUserId = req.user.userId;

    if (resourceOwnerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este recurso'
      });
    }

    next();
  };
};

module.exports = {
  checkRole,
  isSupplier,
  isReseller,
  isOwner
};