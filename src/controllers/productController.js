//sebastian panozzo
const productService = require('../services/productService');

class ProductController {
  async createProduct(req, res) {
    try {
      const supplierId = req.user.userId;
      const productData = req.body;
      const file = req.file;

      const product = await productService.createProduct(productData, supplierId, file);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: product
      });
    } catch (error) {
      if (error.message.includes('categoría')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al crear producto',
        error: error.message
      });
    }
  }

  async listProducts(req, res) {
    try {
      const filters = {
        name: req.query.name,
        categoryId: req.query.categoryId,
        supplierId: req.query.supplierId,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        minRating: req.query.minRating,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await productService.listProducts(filters);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al listar productos',
        error: error.message
      });
    }
  }


  async searchProducts(req, res) {
    try {
      const searchTerm = req.query.name;
      const limit = parseInt(req.query.limit) || 20;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere el parámetro "name" para buscar'
        });
      }

      const products = await productService.searchProducts(searchTerm, limit);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      if (error.message.includes('2 caracteres')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al buscar productos',
        error: error.message
      });
    }
  }


  async getTopRatedProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const products = await productService.getTopRatedProducts(limit);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos mejor valorados',
        error: error.message
      });
    }
  }

  async getRecentProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const products = await productService.getRecentProducts(limit);

      res.status(200).json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener productos recientes',
        error: error.message
      });
    }
  }

  async getProductById(req, res) {
    try {
      const productId = req.params.id;
      const product = await productService.getProductById(productId);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener producto',
        error: error.message
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const productId = req.params.id;
      const supplierId = req.user.userId;
      const updateData = req.body;

      const product = await productService.updateProduct(productId, supplierId, updateData);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: product
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('permiso') || error.message.includes('categoría')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al actualizar producto',
        error: error.message
      });
    }
  }

  async updateProductPhoto(req, res) {
    try {
      const productId = req.params.id;
      const supplierId = req.user.userId;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere una imagen'
        });
      }

      const product = await productService.updateProductPhoto(productId, supplierId, file);

      res.status(200).json({
        success: true,
        message: 'Foto actualizada exitosamente',
        data: product
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
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

  async deleteProduct(req, res) {
    try {
      const productId = req.params.id;
      const supplierId = req.user.userId;

      const result = await productService.deleteProduct(productId, supplierId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { productId: result.productId }
      });
    } catch (error) {
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('permiso')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar producto',
        error: error.message
      });
    }
  }
}

module.exports = new ProductController();