const resellerService = require('../services/resellerService');

class ResellerController {
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await resellerService.getProfile(userId);
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      if (error.message === 'Usuario no encontrado' || error.message === 'No eres un revendedor') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  }
}

module.exports = new ResellerController();