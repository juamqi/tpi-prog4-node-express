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
}

module.exports = new AuthController();