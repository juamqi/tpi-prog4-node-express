const { db, admin } = require('../../config/firebase');

class SupplierService {
    async getProfile(userId) {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Usuario no encontrado');
        }

        const userData = userDoc.data();

        if (userData.userType !== 'supplier') {
            throw new Error('No eres un proveedor');
        }

        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Datos de proveedor no encontrados');
        }

        const supplierData = supplierDoc.data();

        return {
            userId,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            companyName: supplierData.companyName,
            phone: userData.phone,
            website: userData.website,
            photoURL: userData.photoURL,
            userType: userData.userType,
            address: supplierData.address,
            stats: supplierData.stats,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
        };
    }

    async updateProfile(userId, updateData) {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Usuario no encontrado');
        }

        const userData = userDoc.data();

        if (userData.userType !== 'supplier') {
            throw new Error('No eres un proveedor');
        }

        const userUpdates = {};
        const supplierUpdates = {};

        if (updateData.phone !== undefined) userUpdates.phone = updateData.phone;
        if (updateData.website !== undefined) userUpdates.website = updateData.website;
        if (updateData.companyName !== undefined) {
            userUpdates.firstName = updateData.companyName;
            supplierUpdates.companyName = updateData.companyName;
        }
        if (updateData.address !== undefined) supplierUpdates.address = updateData.address;

        if (Object.keys(userUpdates).length === 0 && Object.keys(supplierUpdates).length === 0) {
            throw new Error('No hay campos validos para actualizar');
        }

        if (Object.keys(userUpdates).length > 0) {
            userUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('users').doc(userId).update(userUpdates);
        }

        if (Object.keys(supplierUpdates).length > 0) {
            supplierUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
            await db.collection('suppliers').doc(userId).update(supplierUpdates);
        }

        return await this.getProfile(userId);
    }

    async updatePhoto(userId, photoURL) {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
        throw new Error('Usuario no encontrado');
        }

        const userData = userDoc.data();

        if (userData.userType !== 'supplier') {
        throw new Error('No eres un proveedor');
        }

        await db.collection('users').doc(userId).update({
        photoURL: photoURL,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return await this.getProfile(userId);
    }

    async getSupplierById(userId) {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const userData = userDoc.data();

        if (userData.userType !== 'supplier') {
            throw new Error('Proveedor no encontrado');
        }

        if (!userData.isActive) {
            throw new Error('Proveedor no encontrado');
        }

        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const supplierData = supplierDoc.data();

        return {
            userId,
            companyName: supplierData.companyName,
            photoURL: userData.photoURL,
            website: userData.website,
            address: supplierData.address,
            stats: supplierData.stats,
            createdAt: userData.createdAt
        };
    }

    async listSuppliers(page = 1, limit = 10, filters = {}) {
        let query = db.collection('users')
        .where('userType', '==', 'supplier')
        .where('isActive', '==', true);

        const usersSnapshot = await query.get();
        
        let suppliers = await Promise.all(usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        const userId = doc.id;
        
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) return null;
        
        const supplierData = supplierDoc.data();
        
        return {
            userId,
            companyName: supplierData.companyName,
            photoURL: userData.photoURL,
            website: userData.website,
            address: supplierData.address,
            stats: supplierData.stats,
            createdAt: userData.createdAt
            };
        }));

        suppliers = suppliers.filter(s => s !== null);

        if (filters.province) {
            suppliers = suppliers.filter(s => 
                s.address?.province?.toLowerCase().includes(filters.province.toLowerCase())
            );
        }
        
        if (filters.city) {
            suppliers = suppliers.filter(s => 
                s.address?.city?.toLowerCase().includes(filters.city.toLowerCase())
            );
        }
        
        if (filters.minRating) {
            suppliers = suppliers.filter(s => 
                s.stats?.avgRating >= filters.minRating
            );
        }

        suppliers.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        const totalSuppliers = suppliers.length;
        const offset = (page - 1) * limit;
        const paginatedSuppliers = suppliers.slice(offset, offset + limit);

        const totalPages = Math.ceil(totalSuppliers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
            suppliers: paginatedSuppliers,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalSuppliers,
                itemsPerPage: limit,
                hasNextPage,
                hasPrevPage
            }
        };
    }

    async getSupplierProducts(userId) {
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const productsSnapshot = await db.collection('products')
        .where('supplierId', '==', userId)
        .where('isActive', '==', true)
        .get();

        const products = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            productId: doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            photoURL: data.photoURL,
            categoryId: data.categoryId,
            supplierId: data.supplierId,
            rating: data.rating || 0,
            reviewCount: data.reviewCount || 0,
            favoritesCount: data.favoritesCount || 0,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
        });

        return products;
    }

    async getSupplierStats(userId) {
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const supplierData = supplierDoc.data();

        return {
            totalProducts: supplierData.stats?.totalProducts || 0,
            avgRating: supplierData.stats?.avgRating || 0,
            totalReviews: supplierData.stats?.totalReviews || 0,
            totalFavorites: supplierData.stats?.totalFavorites || 0
        };
    }

    async getFavoritesByProduct(productId) {
        const productDoc = await db.collection('products').doc(productId).get();
        
        if (!productDoc.exists) {
            throw new Error('Producto no encontrado');
        }

        const favoritesSnapshot = await db.collection('favorites')
        .where('productId', '==', productId)
        .where('isActive', '==', true)
        .get();

        const resellers = await Promise.all(favoritesSnapshot.docs.map(async (doc) => {
        const favoriteData = doc.data();
        const resellerId = favoriteData.resellerId;
        
        const resellerDoc = await db.collection('users').doc(resellerId).get();
        
        if (!resellerDoc.exists) return null;
        
        const resellerData = resellerDoc.data();
        
        return {
            resellerId,
            firstName: resellerData.firstName,
            lastName: resellerData.lastName,
            photoURL: resellerData.photoURL,
            markupType: favoriteData.markupType,
            markupValue: favoriteData.markupValue,
            addedAt: favoriteData.addedAt
        };
        }));

        return resellers.filter(r => r !== null);
    }

    async getSupplierReviews(userId) {
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const productsSnapshot = await db.collection('products')
        .where('supplierId', '==', userId)
        .get();

        const productIds = productsSnapshot.docs.map(doc => doc.id);

        if (productIds.length === 0) {
            return [];
        }

        const reviews = [];
        for (let i = 0; i < productIds.length; i += 10) {
            const batch = productIds.slice(i, i + 10);
            
            const reviewsSnapshot = await db.collection('reviews')
                .where('productId', 'in', batch)
                .get();

            const batchReviews = await Promise.all(reviewsSnapshot.docs.map(async (doc) => {
                const reviewData = doc.data();
                
                const resellerDoc = await db.collection('users').doc(reviewData.resellerId).get();
                const productDoc = await db.collection('products').doc(reviewData.productId).get();
                
                return {
                    reviewId: doc.id,
                    productId: reviewData.productId,
                    productName: productDoc.exists ? productDoc.data().name : 'Producto eliminado',
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    reseller: resellerDoc.exists ? {
                        id: reviewData.resellerId,
                        firstName: resellerDoc.data().firstName,
                        lastName: resellerDoc.data().lastName
                    } : null,
                    createdAt: reviewData.createdAt
                };
            }));

            reviews.push(...batchReviews);
        }

        return reviews;
    }

    async getSupplierResellers(userId) {
        const supplierDoc = await db.collection('suppliers').doc(userId).get();
        
        if (!supplierDoc.exists) {
            throw new Error('Proveedor no encontrado');
        }

        const productsSnapshot = await db.collection('products')
        .where('supplierId', '==', userId)
        .get();

        const productIds = productsSnapshot.docs.map(doc => doc.id);

        if (productIds.length === 0) {
            return [];
        }

        const resellerIds = new Set();
        
        for (let i = 0; i < productIds.length; i += 10) {
            const batch = productIds.slice(i, i + 10);
            
            const favoritesSnapshot = await db.collection('favorites')
                .where('productId', 'in', batch)
                .where('isActive', '==', true)
                .get();

            favoritesSnapshot.docs.forEach(doc => {
                resellerIds.add(doc.data().resellerId);
            });
        }

        const resellers = await Promise.all([...resellerIds].map(async (resellerId) => {
            const resellerDoc = await db.collection('users').doc(resellerId).get();
            
            if (!resellerDoc.exists) return null;
            
            const resellerData = resellerDoc.data();

            const favoritesSnapshot = await db.collection('favorites')
                .where('resellerId', '==', resellerId)
                .where('isActive', '==', true)
                .get();
            
            const supplierFavoritesCount = favoritesSnapshot.docs.filter(doc => 
                productIds.includes(doc.data().productId)
            ).length;
            
            return {
                resellerId,
                firstName: resellerData.firstName,
                lastName: resellerData.lastName,
                photoURL: resellerData.photoURL,
                totalFavorites: supplierFavoritesCount
            };
        }));

        return resellers.filter(r => r !== null);
    }
}

module.exports = new SupplierService();
