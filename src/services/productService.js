//sebastian panozzo
const { db, admin } = require('../../config/firebase');
const { uploadFile, updateFile, deleteFile } = require('../utils/uploadHelper');

class ProductService {
  /**
   * Crear un nuevo producto
   * Solo proveedores pueden crear productos
   * 
   * @param {Object} productData - Datos del producto
   * @param {string} supplierId - ID del proveedor que crea el producto
   * @param {Object} [file] - Archivo de imagen (opcional)
   * @returns {Promise<Object>} Producto creado
   */
  async createProduct(productData, supplierId, file = null) {
    const { name, description, price, categoryId } = productData;

    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error('La categoría especificada no existe');
    }

    const productPayload = {
      supplierId,
      categoryId,
      name,
      description: description || '',
      price: parseFloat(price),
      photoURL: '',
      rating: 0,
      reviewCount: 0,
      favoritesCount: 0,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const productRef = await db.collection('products').add(productPayload);
    const productId = productRef.id;

    let photoURL = '';
    if (file) {
      try {
        photoURL = await uploadFile(file, 'products', productId);
        await productRef.update({ photoURL });
      } catch (error) {
        console.error('Error al subir foto del producto:', error);
      }
    }

    const supplierRef = db.collection('suppliers').doc(supplierId);
    await supplierRef.update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(1)
    });

    await db.collection('categories').doc(categoryId).update({
      productCount: admin.firestore.FieldValue.increment(1)
    });

    return {
      productId,
      ...productPayload,
      photoURL,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Listar productos con filtros opcionales
   * 
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Lista de productos y metadata de paginación
   */
  async listProducts(filters = {}) {
    const {
      name,
      categoryId,
      supplierId,
      minPrice,
      maxPrice,
      minRating,
      page = 1,
      limit = 10
    } = filters;
    //corrijo sin pag de firestor
    let query = db.collection('products').where('isActive', '==', true);

    const snapshot = await query.get();

    let products = [];
    for (const doc of snapshot.docs) {
      const productData = doc.data();
      //filtros en memoria sin paginacion de firesotre
      if (categoryId && productData.categoryId !== categoryId) continue;
      if (supplierId && productData.supplierId !== supplierId) continue;
      if (minPrice !== undefined && productData.price < parseFloat(minPrice)) continue;
      if (maxPrice !== undefined && productData.price > parseFloat(maxPrice)) continue;
      if (minRating !== undefined && productData.rating < parseFloat(minRating)) continue;
      
      products.push({
        productId: doc.id,
        ...productData,
        createdAt: productData.createdAt?.toDate(),
        updatedAt: productData.updatedAt?.toDate()
      });
    }

    if (name) {
      const searchTerm = name.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
      );
    }
      products.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA;
    });


    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = products.slice(startIndex, endIndex);
    const enrichedProducts = await this._enrichProductsData(paginatedProducts);


    return {
      products: enrichedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        productsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  /**
   * Buscar productos por nombre
   * 
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} limit - Cantidad máxima de resultados
   * @returns {Promise<Array>} Lista de productos encontrados
   */
  async searchProducts(searchTerm, limit = 20) {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
    }

    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();

    const searchTermLower = searchTerm.toLowerCase();
    let products = snapshot.docs
      .map(doc => ({
        productId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }))
      .filter(product =>
        product.name.toLowerCase().includes(searchTermLower)
      )
      .slice(0, limit);

    return await this._enrichProductsData(products);
  }

  /**
   * Obtener productos mejor valorados
   * 
   * @param {number} limit - Cantidad de productos a retornar
   * @returns {Promise<Array>} Lista de productos mejor valorados
   */
  async getTopRatedProducts(limit = 10) {
    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();

    let products = [];
    for (const doc of snapshot.docs) {
      const productData = doc.data();

      if (productData.reviewCount > 0) {
        products.push({
          productId: doc.id,
          ...productData,
          createdAt: productData.createdAt?.toDate(),
          updatedAt: productData.updatedAt?.toDate()
        });
      }
    }

    products.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return b.reviewCount - a.reviewCount;
    });

    products = products.slice(0, limit);

    return await this._enrichProductsData(products);
  }

  /**
   * Obtener productos recientes
   * 
   * @param {number} limit - Cantidad de productos a retornar
   * @returns {Promise<Array>} Lista de productos más recientes
   */
  async getRecentProducts(limit = 10) {
    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .get();
    let products = snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));
    products.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB - dateA;
    });
    products = products.slice(0, limit);

    return await this._enrichProductsData(products);
  }

  /**
   * Obtener detalle de un producto
   * 
   * @param {string} productId - ID del producto
   * @returns {Promise<Object>} Datos completos del producto
   */
  async getProductById(productId) {
    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = {
      productId: productDoc.id,
      ...productDoc.data(),
      createdAt: productDoc.data().createdAt?.toDate(),
      updatedAt: productDoc.data().updatedAt?.toDate()
    };

    const enriched = await this._enrichProductsData([productData]);
    return enriched[0];
  }

  /**
   * Actualizar un producto
   * Solo el proveedor dueño puede actualizar
   * 
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor que actualiza
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Producto actualizado
   */
  async updateProduct(productId, supplierId, updateData) {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();

    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para modificar este producto');
    }

    if (updateData.categoryId && updateData.categoryId !== productData.categoryId) {
      const categoryDoc = await db.collection('categories').doc(updateData.categoryId).get();
      if (!categoryDoc.exists) {
        throw new Error('La categoría especificada no existe');
      }

      await db.collection('categories').doc(productData.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(-1)
      });
      await db.collection('categories').doc(updateData.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(1)
      });
    }

    const payload = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (payload.price) {
      payload.price = parseFloat(payload.price);
    }

    await productRef.update(payload);

    return await this.getProductById(productId);
  }

  /**
   * Actualizar foto de un producto
   * 
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @param {Object} file - Archivo de imagen
   * @returns {Promise<Object>} Producto con nueva foto
   */
  async updateProductPhoto(productId, supplierId, file) {
    if (!file) {
      throw new Error('No se proporcionó ninguna imagen');
    }

    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();

    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para modificar este producto');
    }

    const photoURL = await updateFile(
      file,
      productData.photoURL,
      'products',
      productId
    );

    await productRef.update({
      photoURL,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return await this.getProductById(productId);
  }

  /**
   * Eliminar un producto (soft delete)
   * 
   * @param {string} productId - ID del producto
   * @param {string} supplierId - ID del proveedor
   * @returns {Promise<Object>} Confirmación de eliminación
   */
  async deleteProduct(productId, supplierId) {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new Error('Producto no encontrado');
    }

    const productData = productDoc.data();

    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para eliminar este producto');
    }

    await productRef.update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });


    await db.collection('suppliers').doc(supplierId).update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(-1)
    });

    await db.collection('categories').doc(productData.categoryId).update({
      productCount: admin.firestore.FieldValue.increment(-1)
    });

    return {
      message: 'Producto eliminado exitosamente',
      productId
    };
  }

  /**
   * Enriquecer lista de productos con datos de proveedor y categoría
   * 
   * @private
   * @param {Array} products - Lista de productos
   * @returns {Promise<Array>} Productos enriquecidos
   */
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
}

module.exports = new ProductService();