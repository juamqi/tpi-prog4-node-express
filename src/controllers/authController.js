const authService = require('../services/authService');

class AuthController {
  async registerReseller(req, res) {
    try {
      const result = await authService.registerReseller(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Revendedor registrado exitosamente',
        data: result
      });
    } catch (error) {
      if (error.message === 'El email ya esta registrado') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar revendedor',
        error: error.message
      });
    }
  }
    async registerSupplier(req, res) {
    try {
      const result = await authService.registerSupplier(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Proveedor registrado exitosamente',
        data: result
      });
    } catch (error) {
      if (error.message === 'El email ya esta registrado') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar proveedor',
        error: error.message
      });
    }
  }
  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      
      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      if (error.message === 'Credenciales invalidas' || error.message === 'Cuenta desactivada') {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesin',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();