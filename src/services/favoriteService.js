//sebastian panozzo
const { db, admin } = require('../../config/firebase');

class FavoriteService {
  /**
   * Agregar un producto a favoritos
   * Solo revendedores pueden marcar favoritos
   * 
   * @param {string} resellerId - ID del revendedor
   * @param {string} productId - ID del producto
   * @returns {Promise<Object>} Favorito creado
   */
  async addFavorite(resellerId, productId) {
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }
    const productData = productDoc.data();

    if (!productData.isActive) {
      throw new Error('El producto no está disponible');
    }


    const existingFavorite = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (!existingFavorite.empty) {
      throw new Error('El producto ya está en tus favoritos');
    }

    const resellerDoc = await db.collection('resellers').doc(resellerId).get();
    const resellerData = resellerDoc.data();

    const favoriteData = {
      resellerId,
      productId,
      supplierId: productData.supplierId,
      markupType: 'default', 
      isActive: true,
      markupValue: resellerData.defaultMarkupValue,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const favoriteRef = await db.collection('favorites').add(favoriteData);

    await db.collection('products').doc(productId).update({
      favoritesCount: admin.firestore.FieldValue.increment(1)
    });

    await db.collection('resellers').doc(resellerId).update({
      'stats.totalFavorites': admin.firestore.FieldValue.increment(1)
    });

    await db.collection('suppliers').doc(productData.supplierId).update({
      'stats.totalFavorites': admin.firestore.FieldValue.increment(1)
    });

    return {
      favoriteId: favoriteRef.id,
      ...favoriteData,
      defaultMarkupType: resellerData.markupType,
      defaultMarkupValue: resellerData.defaultMarkupValue,
      addedAt: new Date()
    };
  }

  /**
   * Quitar un producto de favoritos
   * 
   * @param {string} resellerId - ID del revendedor
   * @param {string} productId - ID del producto
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async removeFavorite(resellerId, productId) {
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];

    const productDoc = await db.collection('products').doc(productId).get();
    

    await favoriteDoc.ref.delete();

    if (productDoc.exists) {
      await db.collection('products').doc(productId).update({
        favoritesCount: admin.firestore.FieldValue.increment(-1)
      });

      const productData = productDoc.data();
      await db.collection('suppliers').doc(productData.supplierId).update({
        'stats.totalFavorites': admin.firestore.FieldValue.increment(-1)
      });
    }

    await db.collection('resellers').doc(resellerId).update({
      'stats.totalFavorites': admin.firestore.FieldValue.increment(-1)
    });

    return {
      message: 'Producto eliminado de favoritos',
      productId
    };
  }

  /**
   * Obtener todos los favoritos de un revendedor
   * 
   * @param {string} resellerId - ID del revendedor
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Lista de favoritos
   */
  async getFavorites(resellerId, filters = {}) {
    const { page = 1, limit = 10 } = filters;

    const snapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('isActive', '==', true)
      .get();

    const favorites = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const favoriteData = {
          favoriteId: doc.id,
          ...doc.data(),
          addedAt: doc.data().addedAt?.toDate()
        };

        const productDoc = await db.collection('products').doc(favoriteData.productId).get();
        
        if (!productDoc.exists) {
          return { ...favoriteData, product: null };
        }

        const productData = {
          productId: productDoc.id,
          ...productDoc.data()
        };

        const supplierDoc = await db.collection('suppliers').doc(productData.supplierId).get();
        const supplierData = supplierDoc.exists ? {
          companyName: supplierDoc.data().companyName,
          address: supplierDoc.data().address
        } : null;

        const categoryDoc = await db.collection('categories').doc(productData.categoryId).get();
        const categoryData = categoryDoc.exists ? {
          name: categoryDoc.data().name
        } : null;

        const finalPrice = this._calculateFinalPrice(
          productData.price,
          favoriteData,
          resellerId
        );

        return {
          ...favoriteData,
          product: {
            ...productData,
            supplier: supplierData,
            category: categoryData,
            finalPrice: await finalPrice
          }
        };
      })
    );

    let validFavorites = favorites.filter(f => f.product !== null);

    validFavorites.sort((a, b) => {
      const dateA = a.addedAt || new Date(0);
      const dateB = b.addedAt || new Date(0);
      return dateB - dateA;
    });

    const totalFavorites = validFavorites.length;
    const totalPages = Math.ceil(totalFavorites / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedFavorites = validFavorites.slice(startIndex, endIndex);

    return {
      favorites: paginatedFavorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalFavorites,
        favoritesPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Obtener favoritos agrupados por categoría
   * 
   * @param {string} resellerId - ID del revendedor
   * @returns {Promise<Object>} Favoritos agrupados
   */
  async getFavoritesByCategory(resellerId) {
    const favoritesSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('isActive', '==', true)
      .get();

    if (favoritesSnapshot.empty) {
      return { categories: [] };
    }


    const productIds = favoritesSnapshot.docs.map(doc => doc.data().productId);

    const productsData = {};
    for (const productId of productIds) {
      const productDoc = await db.collection('products').doc(productId).get();
      if (productDoc.exists) {
        productsData[productId] = {
          productId,
          ...productDoc.data()
        };
      }
    }


    const categoriesMap = {};
    
    for (const favoriteDoc of favoritesSnapshot.docs) {
      const favoriteData = {
        favoriteId: favoriteDoc.id,
        ...favoriteDoc.data(),
        addedAt: favoriteDoc.data().addedAt?.toDate()
      };

      const product = productsData[favoriteData.productId];
      
      if (!product || !product.isActive) continue;

      const categoryId = product.categoryId;

      if (!categoriesMap[categoryId]) {

        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        categoriesMap[categoryId] = {
          categoryId,
          categoryName: categoryDoc.exists ? categoryDoc.data().name : 'Sin categoría',
          products: []
        };
      }

      const finalPrice = await this._calculateFinalPrice(
        product.price,
        favoriteData,
        resellerId
      );

      categoriesMap[categoryId].products.push({
        ...favoriteData,
        product: {
          ...product,
          finalPrice
        }
      });
    }
    const categories = Object.values(categoriesMap)
      .sort((a, b) => b.products.length - a.products.length);

      categories.forEach(category => {
      category.products.sort((a, b) => {
        const dateA = a.addedAt || new Date(0);
        const dateB = b.addedAt || new Date(0);
        return dateB - dateA;
      });
    });
    return { categories };
  }

  /**
   * Configurar markup específico para un producto favorito
   * 
   * @param {string} resellerId - ID del revendedor
   * @param {string} productId - ID del producto
   * @param {Object} markupConfig - Configuración de markup
   * @returns {Promise<Object>} Configuración actualizada
   */
  async setProductMarkup(resellerId, productId, markupConfig) {
    const { markupType, markupValue } = markupConfig;

    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];

    const updateData = {
      markupType,
      markupValue: markupType === 'default' ? 0 : parseFloat(markupValue)
    };

    await favoriteDoc.ref.update(updateData);
    const updatedDoc = await favoriteDoc.ref.get();
    
    return {
      favoriteId: updatedDoc.id,
      ...updatedDoc.data(),
      message: 'Configuración de markup actualizada'
    };
  }

  /**
   * Obtener configuración de markup de un producto favorito
   * 
   * @param {string} resellerId - ID del revendedor
   * @param {string} productId - ID del producto
   * @returns {Promise<Object>} Configuración de markup
   */
  async getProductMarkup(resellerId, productId) {
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];
    const favoriteData = favoriteDoc.data();
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();

    const resellerDoc = await db.collection('resellers').doc(resellerId).get();
    const resellerData = resellerDoc.data();

    const finalPrice = await this._calculateFinalPrice(
      productData.price,
      favoriteData,
      resellerId
    );

    return {
      favoriteId: favoriteDoc.id,
      productId,
      productName: productData.name,
      basePrice: productData.price,
      currentMarkup: {
        type: favoriteData.markupType,
        value: favoriteData.markupValue
      },
      defaultMarkup: {
        type: resellerData.markupType,
        value: resellerData.defaultMarkupValue
      },
      finalPrice
    };
  }

  /**
   * Calcular precio final aplicando markup
   * 
   * @private
   * @param {number} basePrice - Precio base del producto
   * @param {Object} favoriteData - Datos del favorito
   * @param {string} resellerId - ID del revendedor
   * @returns {Promise<number>} Precio final calculado
   */
  async _calculateFinalPrice(basePrice, favoriteData, resellerId) {
    let markupType = favoriteData.markupType;
    let markupValue = favoriteData.markupValue;

    if (markupType === 'default') {
      const resellerDoc = await db.collection('resellers').doc(resellerId).get();
      if (resellerDoc.exists) {
        const resellerData = resellerDoc.data();
        markupType = resellerData.markupType;
        markupValue = resellerData.defaultMarkupValue;
      }
    }
    let finalPrice = basePrice;

    if (markupType === 'fixed') {
      finalPrice = basePrice + markupValue;
    } else if (markupType === 'percentage') {
      finalPrice = basePrice * (1 + markupValue / 100);
    }

    return Math.round(finalPrice * 100) / 100; 
  }
  async _enrichProductsData(products) {
    if (products.length === 0) return [];

    const supplierIds = [...new Set(products.map(p => p.supplierId))];
    const categoryIds = [...new Set(products.map(p => p.categoryId))];

    const suppliersData = {};
    for (const supplierId of supplierIds) {
      try {
        const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
        if (supplierDoc.exists) {
          suppliersData[supplierId] = {
            companyName: supplierDoc.data().companyName,
            address: supplierDoc.data().address
          };
        }
      } catch (error) {
        console.error(`Error al obtener proveedor ${supplierId}:`, error);
      }
    }

    const categoriesData = {};
    for (const categoryId of categoryIds) {
      try {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        if (categoryDoc.exists) {
          categoriesData[categoryId] = {
            name: categoryDoc.data().name
          };
        }
      } catch (error) {
        console.error(`Error al obtener categoría ${categoryId}:`, error);
      }
    }

    return products.map(product => ({
      ...product,
      supplier: suppliersData[product.supplierId] || null,
      category: categoriesData[product.categoryId] || null
    }));
  }
  //sorianicolas
  async getFavoriteDetail(resellerId, productId) {
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];
    const favoriteData = {
      favoriteId: favoriteDoc.id,
      ...favoriteDoc.data(),
      addedAt: favoriteDoc.data().addedAt?.toDate()
    };

    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = {
      productId: productDoc.id,
      ...productDoc.data()
    };

    const enriched = await this._enrichProductsData([productData]);
    
    const finalPrice = await this._calculateFinalPrice(
      productData.price,
      favoriteData,
      resellerId
    );

    return {
      ...favoriteData,
      product: {
        ...enriched[0],
        finalPrice
      }
    };
  }
}

module.exports = new FavoriteService();