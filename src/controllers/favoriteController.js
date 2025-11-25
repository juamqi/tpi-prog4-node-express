/**
 * Controlador de Favoritos
 * 
 * Maneja las peticiones HTTP relacionadas con favoritos
 * y delega la lógica de negocio al servicio correspondiente
 */

const favoriteService = require('../services/favoriteService');

class FavoriteController {
  /**
   * POST /favorites
   * Agregar un producto a favoritos
   * Solo revendedores autenticados
   */
  async addFavorite(req, res) {
    try {
      const resellerId = req.user.userId;
      const { productId } = req.body;

      const favorite = await favoriteService.addFavorite(resellerId, productId);

      res.status(201).json({
        success: true,
        message: 'Producto agregado a favoritos',
        data: favorite
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('ya está') || error.message.includes('disponible')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al agregar a favoritos',
        error: error.message
      });
    }
  }

  /**
   * DELETE /favorites/:productId
   * Quitar un producto de favoritos
   * Solo revendedores autenticados
   */
  async removeFavorite(req, res) {
    try {
      const resellerId = req.user.userId;
      const productId = req.params.productId;

      const result = await favoriteService.removeFavorite(resellerId, productId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { productId: result.productId }
      });
    } catch (error) {
      if (error.message.includes('no está en')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al quitar de favoritos',
        error: error.message
      });
    }
  }

  /**
   * GET /favorites
   * Obtener mis productos favoritos
   * Solo revendedores autenticados
   */
  async getFavorites(req, res) {
    try {
      const resellerId = req.user.userId;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await favoriteService.getFavorites(resellerId, filters);

      res.status(200).json({
        success: true,
        data: result.favorites,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener favoritos',
        error: error.message
      });
    }
  }

  /**
   * GET /favorites/by-category
   * Obtener favoritos agrupados por categoría
   * Solo revendedores autenticados
   */
  async getFavoritesByCategory(req, res) {
    try {
      const resellerId = req.user.userId;
      const result = await favoriteService.getFavoritesByCategory(resellerId);

      res.status(200).json({
        success: true,
        data: result.categories,
        totalCategories: result.categories.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener favoritos por categoría',
        error: error.message
      });
    }
  }

  /**
   * PUT /favorites/:productId/markup
   * Configurar markup específico para un producto favorito
   * Solo revendedores autenticados
   */
  async setProductMarkup(req, res) {
    try {
      const resellerId = req.user.userId;
      const productId = req.params.productId;
      const markupConfig = req.body;

      const result = await favoriteService.setProductMarkup(
        resellerId,
        productId,
        markupConfig
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          favoriteId: result.favoriteId,
          markupType: result.markupType,
          markupValue: result.markupValue
        }
      });
    } catch (error) {
      if (error.message.includes('no está en')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al configurar markup',
        error: error.message
      });
    }
  }

  /**
   * GET /favorites/:productId/markup
   * Ver configuración de markup de un producto favorito
   * Solo revendedores autenticados
   */
  async getProductMarkup(req, res) {
    try {
      const resellerId = req.user.userId;
      const productId = req.params.productId;

      const result = await favoriteService.getProductMarkup(resellerId, productId);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado' || error.message.includes('no está en')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener configuración de markup',
        error: error.message
      });
    }
  }
}

module.exports = new FavoriteController();