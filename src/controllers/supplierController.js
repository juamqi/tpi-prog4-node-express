const supplierService = require('../services/supplierService');

class SupplierController {
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;
            const profile = await supplierService.getProfile(userId);
            
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado' || error.message === 'No eres un proveedor') {
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
            
            const updatedProfile = await supplierService.updateProfile(userId, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Perfil actualizado exitosamente',
                data: updatedProfile
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado' || error.message === 'No eres un proveedor') {
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
            
            const updatedProfile = await supplierService.updatePhoto(userId, photoURL);
            
            res.status(200).json({
                success: true,
                message: 'Foto de perfil actualizada exitosamente',
                data: updatedProfile
            });
        } catch (error) {
            if (error.message === 'Usuario no encontrado' || error.message === 'No eres un proveedor') {
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

    async getSupplierById(req, res) {
        try {
            const { id } = req.params;
            const profile = await supplierService.getSupplierById(id);
            
            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            if (error.message === 'Proveedor no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener perfil del proveedor',
                error: error.message
            });
        }
    }

    async listSuppliers(req, res) {
        try {
            const { page, limit, province, city, minRating } = req.query;
            
            const filters = {};
            if (province) filters.province = province;
            if (city) filters.city = city;
            if (minRating) filters.minRating = parseFloat(minRating);
            
            const result = await supplierService.listSuppliers(page, limit, filters);
            
            res.status(200).json({
                success: true,
                data: result.suppliers,
                pagination: result.pagination
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error al listar proveedores',
                error: error.message
            });
        }
    }

    async getSupplierProducts(req, res) {
        try {
            const { id } = req.params;
            const products = await supplierService.getSupplierProducts(id);
            
            res.status(200).json({
                success: true,
                data: products
            });
        } catch (error) {
            if (error.message === 'Proveedor no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener productos del proveedor',
                error: error.message
            });
        }
    }

    async getSupplierStats(req, res) {
        try {
            const { id } = req.params;
            const stats = await supplierService.getSupplierStats(id);
            
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            if (error.message === 'Proveedor no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas',
                error: error.message
            });
        }
    }

    async getFavoritesByProduct(req, res) {
        try {
            const { productId } = req.params;
            const resellers = await supplierService.getFavoritesByProduct(productId);
            
            res.status(200).json({
                success: true,
                data: resellers
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
                message: 'Error al obtener favoritos',
                error: error.message
            });
        }
    }

    async getSupplierReviews(req, res) {
        try {
            const { id } = req.params;
            const reviews = await supplierService.getSupplierReviews(id);
            
            res.status(200).json({
                success: true,
                data: reviews
            });
        } catch (error) {
            if (error.message === 'Proveedor no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

        res.status(500).json({
            success: false,
            message: 'Error al obtener reseñas',
            error: error.message
        });
        }
    }

    async getSupplierResellers(req, res) {
        try {
            const { id } = req.params;
            const resellers = await supplierService.getSupplierResellers(id);
            
            res.status(200).json({
                success: true,
                data: resellers
            });
        } catch (error) {
            if (error.message === 'Proveedor no encontrado') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error al obtener revendedores',
                error: error.message
            });
        }
    }
}

module.exports = new SupplierController();