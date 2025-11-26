//soria nicolas
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
  async updateProfile(req, res) {
    try {
        const userId = req.user.userId;
        const updateData = req.body;
        
        const updatedProfile = await resellerService.updateProfile(userId, updateData);
        
        res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedProfile
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
        message: 'Error al actualizar perfil',
        error: error.message
        });
    }
    }
    async updatePhoto(req, res) {
  try {
    const userId = req.user.userId;
    const { photoURL } = req.body;
    
    const updatedProfile = await resellerService.updatePhoto(userId, photoURL);
    
    res.status(200).json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: updatedProfile
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
      message: 'Error al actualizar foto',
      error: error.message
    });
  }
}
async getResellerById(req, res) {
  try {
    const { id } = req.params;
    const profile = await resellerService.getResellerById(id);
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    if (error.message === 'Revendedor no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del revendedor',
      error: error.message
    });
  }
}
async listResellers(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await resellerService.listResellers(page, limit);
    
    res.status(200).json({
      success: true,
      data: result.resellers,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al listar revendedores',
      error: error.message
    });
  }
}
async deactivateAccount(req, res) {
  try {
    const userId = req.user.userId;
    await resellerService.deactivateAccount(userId);
    
    res.status(200).json({
      success: true,
      message: 'Cuenta desactivada exitosamente'
    });
  } catch (error) {
    if (error.message === 'Usuario no encontrado' || error.message === 'No eres un revendedor') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'La cuenta ya está desactivada') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al desactivar cuent',
      error: error.message
    });
  }
}
}

module.exports = new ResellerController();