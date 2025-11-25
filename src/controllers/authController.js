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

    async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user.userId;

      await authService.logout(userId, refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesion',
        error: error.message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      res.status(200).json({
        success: true,
        message: 'Token renovado exitosamente',
        data: result
      });
    } catch (error) {
      if (error.message.includes('inválido') || error.message.includes('expirado')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al renovar token',
        error: error.message
      });
    }
  }
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al procesar solicitud',
        error: error.message
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      if (error.message.includes('invalido') || error.message.includes('expirado')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al restablecer contraseña',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();