const { db } = require('../../config/firebase');

class CategoryService {
    async listCategories(page = 1, limit = 10) {
        const categoriesSnapshot = await db.collection('categories').get();

        const categories = categoriesSnapshot.docs
        .map(doc => {
            const data = doc.data();
            return {
            categoryId: doc.id,
            name: data.name,
            description: data.description,
            productCount: data.productCount || 0,
            createdAt: data.createdAt
            };
        })
        .sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        const totalCategories = categories.length;
        const offset = (page - 1) * limit;
        const paginatedCategories = categories.slice(offset, offset + limit);

        const totalPages = Math.ceil(totalCategories / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
        categories: paginatedCategories,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCategories,
            itemsPerPage: limit,
            hasNextPage,
            hasPrevPage
        }
        };
    }

    async getCategoryById(categoryId) {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        
        if (!categoryDoc.exists) {
        throw new Error('Categoría no encontrada');
        }

        const categoryData = categoryDoc.data();

        return {
        categoryId,
        name: categoryData.name,
        description: categoryData.description,
        productCount: categoryData.productCount || 0,
        createdAt: categoryData.createdAt
        };
    }

    async getCategoryProducts(categoryId) {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        
        if (!categoryDoc.exists) {
            throw new Error('Categoría no encontrada');
        }

        const productsSnapshot = await db.collection('products')
        .where('categoryId', '==', categoryId)
        .where('isActive', '==', true)
        .get();

        const products = await Promise.all(productsSnapshot.docs.map(async (doc) => {
            const productData = doc.data();
            
            const supplierDoc = await db.collection('suppliers').doc(productData.supplierId).get();
            const userDoc = await db.collection('users').doc(productData.supplierId).get();
            
            return {
                    productId: doc.id,
                    name: productData.name,
                    description: productData.description,
                    price: productData.price,
                    photoURL: productData.photoURL,
                    supplier: supplierDoc.exists && userDoc.exists ? {
                        supplierId: productData.supplierId,
                        companyName: supplierDoc.data().companyName,
                        photoURL: userDoc.data().photoURL
                    } : null,
                    rating: productData.rating || 0,
                    reviewCount: productData.reviewCount || 0,
                    favoritesCount: productData.favoritesCount || 0,
                    createdAt: productData.createdAt
            };
        }));

        return products;
    }

    async getPopularCategories(limit = 10) {
        const categoriesSnapshot = await db.collection('categories').get();

        const categoriesWithData = await Promise.all(
            categoriesSnapshot.docs.map(async (doc) => {
                const categoryData = doc.data();
                
                const productsSnapshot = await db.collection('products')
                .where('categoryId', '==', doc.id)
                .where('isActive', '==', true)
                .get();

                let totalFavorites = 0;
                productsSnapshot.docs.forEach(productDoc => {
                const productData = productDoc.data();
                totalFavorites += productData.favoritesCount || 0;
                });

                return {
                categoryId: doc.id,
                name: categoryData.name,
                description: categoryData.description,
                productCount: categoryData.productCount || 0,
                totalFavorites,
                createdAt: categoryData.createdAt
                };
            })
        );

        const popularCategories = categoriesWithData.sort((a, b) => {
            const scoreA = (a.totalFavorites * 2) + a.productCount;
            const scoreB = (b.totalFavorites * 2) + b.productCount;
            return scoreB - scoreA;
        })
        .slice(0, limit);

        return popularCategories;
    }

    async getCategorySuppliers(categoryId) {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        
        if (!categoryDoc.exists) {
            throw new Error('Categoría no encontrada');
        }

        const productsSnapshot = await db.collection('products')
        .where('categoryId', '==', categoryId)
        .where('isActive', '==', true)
        .get();

        const supplierIds = [...new Set(productsSnapshot.docs.map(doc => doc.data().supplierId))];

        const suppliers = await Promise.all(supplierIds.map(async (supplierId) => {
            const userDoc = await db.collection('users').doc(supplierId).get();
            const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
            
            if (!userDoc.exists || !supplierDoc.exists) return null;
            
            const userData = userDoc.data();
            const supplierData = supplierDoc.data();
            
            const supplierProducts = productsSnapshot.docs.filter(
                doc => doc.data().supplierId === supplierId
            ).length;
            
            return {
                supplierId,
                companyName: supplierData.companyName,
                photoURL: userData.photoURL,
                website: userData.website,
                productsInCategory: supplierProducts,
                stats: supplierData.stats
            };
        }));

        return suppliers.filter(s => s !== null);
    }
}

module.exports = new CategoryService();