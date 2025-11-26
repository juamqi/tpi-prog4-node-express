const categoryService = require('../services/categoryService');

class CategoryController {
    async listCategories(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await categoryService.listCategories(page, limit);
            
            res.status(200).json({
                success: true,
                data: result.categories,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al listar categorías',
                error: error.message
            });
        }
    }

    async getCategoryById(req, res) {
        try {
            const { id } = req.params;
            const category = await categoryService.getCategoryById(id);
            
            res.status(200).json({
                success: true,
                data: category
            });
        } catch (error) {
            if (error.message === 'Categoría no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener categoría',
                error: error.message
            });
        }
    }

    async getCategoryProducts(req, res) {
        try {
            const { id } = req.params;
            const products = await categoryService.getCategoryProducts(id);
            
            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error) {
            if (error.message === 'Categoría no encontrada') {
                return res.status(404).json({
                success: false,
                message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener productos de la categoría',
                error: error.message
            });
        }
    }

    async getPopularCategories(req, res) {
        try {
            const { limit } = req.query;
            const categories = await categoryService.getPopularCategories(limit);
            
            res.status(200).json({
                success: true,
                data: categories
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener categorías populares',
                error: error.message
            });
        }
    }

    async getCategorySuppliers(req, res) {
        try {
            const { id } = req.params;
            const suppliers = await categoryService.getCategorySuppliers(id);
            
            res.status(200).json({
                success: true,
                data: suppliers
            });
        } catch (error) {
            if (error.message === 'Categoría no encontrada') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener proveedores de la categoría',
                error: error.message
            });
        }
    }
}

module.exports = new CategoryController();