/**
 * Servicio de Productos
 * 
 * Lógica de negocio para operaciones CRUD de productos
 * y funcionalidades adicionales como búsqueda y filtrado
 */

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

    // Verificar que la categoría exista
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists) {
      throw new Error('La categoría especificada no existe');
    }

    // Preparar datos del producto
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

    // Crear producto en Firestore
    const productRef = await db.collection('products').add(productPayload);
    const productId = productRef.id;

    // Subir foto si se proporcionó
    let photoURL = '';
    if (file) {
      try {
        photoURL = await uploadFile(file, 'products', productId);
        await productRef.update({ photoURL });
      } catch (error) {
        console.error('Error al subir foto del producto:', error);
        // No fallar la creación si falla el upload de la foto
      }
    }

    // Incrementar contador de productos del proveedor
    const supplierRef = db.collection('suppliers').doc(supplierId);
    await supplierRef.update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(1)
    });

    // Incrementar contador de productos de la categoría
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

    let query = db.collection('products').where('isActive', '==', true);

    // Aplicar filtros
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    if (supplierId) {
      query = query.where('supplierId', '==', supplierId);
    }

    if (minPrice !== undefined) {
      query = query.where('price', '>=', parseFloat(minPrice));
    }

    if (maxPrice !== undefined) {
      query = query.where('price', '<=', parseFloat(maxPrice));
    }

    if (minRating !== undefined) {
      query = query.where('rating', '>=', parseFloat(minRating));
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.orderBy('createdAt', 'desc');

    // Obtener total de documentos que coinciden (antes de paginar)
    const countSnapshot = await query.count().get();
    const totalProducts = countSnapshot.data().count;

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const snapshot = await query.get();

    // Procesar productos
    let products = snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Filtrar por nombre si se proporcionó (Firestore no soporta LIKE)
    if (name) {
      const searchTerm = name.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    // Enriquecer con información de proveedor y categoría
    const enrichedProducts = await this._enrichProductsData(products);

    return {
      products: enrichedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        productsPerPage: limit,
        hasNextPage: page < Math.ceil(totalProducts / limit),
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

    // Obtener todos los productos activos
    const snapshot = await db.collection('products')
      .where('isActive', '==', true)
      .orderBy('rating', 'desc')
      .limit(100) // Limitar la búsqueda inicial
      .get();

    // Filtrar por nombre en memoria (case-insensitive)
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
      .where('reviewCount', '>', 0) // Solo productos con reseñas
      .orderBy('reviewCount', 'desc')
      .orderBy('rating', 'desc')
      .limit(limit)
      .get();

    const products = snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

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
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const products = snapshot.docs.map(doc => ({
      productId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

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

    // Enriquecer con datos de proveedor y categoría
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

    // Verificar que el proveedor sea el dueño
    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para modificar este producto');
    }

    // Si se está cambiando la categoría, verificar que exista
    if (updateData.categoryId && updateData.categoryId !== productData.categoryId) {
      const categoryDoc = await db.collection('categories').doc(updateData.categoryId).get();
      if (!categoryDoc.exists) {
        throw new Error('La categoría especificada no existe');
      }

      // Actualizar contadores de categorías
      await db.collection('categories').doc(productData.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(-1)
      });
      await db.collection('categories').doc(updateData.categoryId).update({
        productCount: admin.firestore.FieldValue.increment(1)
      });
    }

    // Preparar datos de actualización
    const payload = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Si hay precio, convertirlo a número
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

    // Verificar que el proveedor sea el dueño
    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para modificar este producto');
    }

    // Actualizar foto
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

    // Verificar que el proveedor sea el dueño
    if (productData.supplierId !== supplierId) {
      throw new Error('No tienes permiso para eliminar este producto');
    }

    // Soft delete: marcar como inactivo
    await productRef.update({
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Actualizar contador de productos del proveedor
    await db.collection('suppliers').doc(supplierId).update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(-1)
    });

    // Actualizar contador de productos de la categoría
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

    // Obtener IDs únicos de proveedores y categorías
    const supplierIds = [...new Set(products.map(p => p.supplierId))];
    const categoryIds = [...new Set(products.map(p => p.categoryId))];

    // Obtener datos de proveedores
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

    // Obtener datos de categorías
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

    // Enriquecer productos
    return products.map(product => ({
      ...product,
      supplier: suppliersData[product.supplierId] || null,
      category: categoriesData[product.categoryId] || null
    }));
  }
}

module.exports = new ProductService();