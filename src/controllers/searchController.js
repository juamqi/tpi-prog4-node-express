const searchService = require('../services/searchService');

class SearchController {
  async advancedSearch(req, res) {
    try {
      const { query, searchIn = 'both' } = req.query;
      const filters = {
        categoryId: req.query['filters[categoryId]'] ?? null,
        province: req.query['filters[province]'] ?? null,
        minPrice: req.query['filters[minPrice]'] ?? null,
        maxPrice: req.query['filters[maxPrice]'] ?? null,
        minRating: req.query['filters[minRating]'] ?? null
      };

      const results = await searchService.advancedSearch({ query, searchIn, filters });

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al realizar la búsqueda',
        error: error.message
      });
    }
  }

  async getSearchFilters(_req, res) {
    try {
      const filters = await searchService.getSearchFilters();
      res.status(200).json({
        success: true,
        data: filters
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener filtros de búsqueda',
        error: error.message
      });
    }
  }

  async getRelatedProducts(req, res) {
    try {
      const { id } = req.params;
      const related = await searchService.getRelatedProducts(id);

      res.status(200).json({
        success: true,
        data: related
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener productos relacionados',
        error: error.message
      });
    }
  }

  async getProductsBySupplier(req, res) {
    try {
      const { supplierId } = req.params;
      const products = await searchService.getProductsBySupplier(supplierId);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos del proveedor',
        error: error.message
      });
    }
  }

  async getFavoriteSuppliers(req, res) {
    try {
      const { id: resellerId } = req.params;

      if (!req.user || req.user.userId !== resellerId) {
        return res.status(403).json({
          success: false,
          message: 'No tenés permiso para ver los proveedores favoritos de este usuario'
        });
      }

      const suppliers = await searchService.getFavoriteSuppliers(resellerId);

      res.status(200).json({
        success: true,
        data: suppliers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener proveedores favoritos',
        error: error.message
      });
    }
  }
}

module.exports = new SearchController();