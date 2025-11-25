/**
 * Servicio de Favoritos
 * 
 * Lógica de negocio para gestión de productos favoritos
 * y configuración de markup personalizado
 */

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
    // Verificar que el producto exista y esté activo
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    if (!productDoc.data().isActive) {
      throw new Error('El producto no está disponible');
    }

    // Verificar que no esté ya en favoritos
    const existingFavorite = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (!existingFavorite.empty) {
      throw new Error('El producto ya está en tus favoritos');
    }

    // Obtener configuración de markup por defecto del revendedor
    const resellerDoc = await db.collection('resellers').doc(resellerId).get();
    const resellerData = resellerDoc.data();

    // Crear favorito con configuración por defecto
    const favoriteData = {
      resellerId,
      productId,
      markupType: 'default', // Usar markup por defecto inicialmente
      markupValue: 0, // Se calculará en base a la configuración del revendedor
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const favoriteRef = await db.collection('favorites').add(favoriteData);

    // Incrementar contador de favoritos en el producto
    await db.collection('products').doc(productId).update({
      favoritesCount: admin.firestore.FieldValue.increment(1)
    });

    // Incrementar contador de favoritos en stats del revendedor
    await db.collection('resellers').doc(resellerId).update({
      'stats.totalFavorites': admin.firestore.FieldValue.increment(1)
    });

    // Incrementar contador de favoritos en stats del proveedor
    const productData = productDoc.data();
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
    // Buscar el favorito
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];

    // Obtener datos del producto antes de eliminar
    const productDoc = await db.collection('products').doc(productId).get();
    
    // Eliminar favorito
    await favoriteDoc.ref.delete();

    // Decrementar contador de favoritos en el producto
    if (productDoc.exists) {
      await db.collection('products').doc(productId).update({
        favoritesCount: admin.firestore.FieldValue.increment(-1)
      });

      // Decrementar contador de favoritos en stats del proveedor
      const productData = productDoc.data();
      await db.collection('suppliers').doc(productData.supplierId).update({
        'stats.totalFavorites': admin.firestore.FieldValue.increment(-1)
      });
    }

    // Decrementar contador de favoritos en stats del revendedor
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

    let query = db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .orderBy('addedAt', 'desc');

    // Obtener total
    const countSnapshot = await query.count().get();
    const totalFavorites = countSnapshot.data().count;

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    // Obtener favoritos con datos de productos
    const favorites = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const favoriteData = {
          favoriteId: doc.id,
          ...doc.data(),
          addedAt: doc.data().addedAt?.toDate()
        };

        // Obtener datos del producto
        const productDoc = await db.collection('products').doc(favoriteData.productId).get();
        
        if (!productDoc.exists) {
          return { ...favoriteData, product: null };
        }

        const productData = {
          productId: productDoc.id,
          ...productDoc.data()
        };

        // Obtener datos del proveedor
        const supplierDoc = await db.collection('suppliers').doc(productData.supplierId).get();
        const supplierData = supplierDoc.exists ? {
          companyName: supplierDoc.data().companyName,
          address: supplierDoc.data().address
        } : null;

        // Obtener datos de la categoría
        const categoryDoc = await db.collection('categories').doc(productData.categoryId).get();
        const categoryData = categoryDoc.exists ? {
          name: categoryDoc.data().name
        } : null;

        // Calcular precio final con markup
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

    return {
      favorites: favorites.filter(f => f.product !== null), // Filtrar productos eliminados
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFavorites / limit),
        totalFavorites,
        favoritesPerPage: limit,
        hasNextPage: page < Math.ceil(totalFavorites / limit),
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
    // Obtener todos los favoritos del revendedor
    const favoritesSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .orderBy('addedAt', 'desc')
      .get();

    if (favoritesSnapshot.empty) {
      return { categories: [] };
    }

    // Obtener IDs de productos
    const productIds = favoritesSnapshot.docs.map(doc => doc.data().productId);

    // Obtener datos de productos
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

    // Agrupar por categoría
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
        // Obtener datos de la categoría
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        categoriesMap[categoryId] = {
          categoryId,
          categoryName: categoryDoc.exists ? categoryDoc.data().name : 'Sin categoría',
          products: []
        };
      }

      // Calcular precio final
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

    // Convertir a array y ordenar por cantidad de productos
    const categories = Object.values(categoriesMap)
      .sort((a, b) => b.products.length - a.products.length);

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

    // Buscar el favorito
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];

    // Preparar actualización
    const updateData = {
      markupType,
      markupValue: markupType === 'default' ? 0 : parseFloat(markupValue)
    };

    await favoriteDoc.ref.update(updateData);

    // Obtener datos actualizados
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
    // Buscar el favorito
    const favoriteSnapshot = await db.collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('productId', '==', productId)
      .get();

    if (favoriteSnapshot.empty) {
      throw new Error('El producto no está en tus favoritos');
    }

    const favoriteDoc = favoriteSnapshot.docs[0];
    const favoriteData = favoriteDoc.data();

    // Obtener datos del producto
    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();

    // Obtener configuración por defecto del revendedor
    const resellerDoc = await db.collection('resellers').doc(resellerId).get();
    const resellerData = resellerDoc.data();

    // Calcular precio final
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

    // Si usa markup por defecto, obtener la configuración del revendedor
    if (markupType === 'default') {
      const resellerDoc = await db.collection('resellers').doc(resellerId).get();
      if (resellerDoc.exists) {
        const resellerData = resellerDoc.data();
        markupType = resellerData.markupType;
        markupValue = resellerData.defaultMarkupValue;
      }
    }

    // Calcular precio final según tipo de markup
    let finalPrice = basePrice;

    if (markupType === 'fixed') {
      finalPrice = basePrice + markupValue;
    } else if (markupType === 'percentage') {
      finalPrice = basePrice * (1 + markupValue / 100);
    }

    return Math.round(finalPrice * 100) / 100; // Redondear a 2 decimales
  }
}

module.exports = new FavoriteService();