const { db } = require('../../config/firebase');

const mapDoc = (doc) => ({ id: doc.id, ...doc.data() });
const mapDocs = (snap) => snap.docs.map(mapDoc);

class SearchService {
  async advancedSearch(params) {
    const { query = '', searchIn = 'both', filters = {} } = params;
    const results = {
      products: [],
      suppliers: []
    };

    if (searchIn === 'products' || searchIn === 'both') {
      let ref = db.collection('products').where('isActive', '==', true);

      if (filters.categoryId) {
        ref = ref.where('categoryId', '==', filters.categoryId);
      }

      const snap = await ref.get();
      let products = mapDocs(snap);

      const queryLower = query.toLowerCase();
      if (queryLower) {
        products = products.filter((p) => (p.name || '').toLowerCase().includes(queryLower));
      }

      if (filters.minPrice !== null && filters.minPrice !== undefined) {
        products = products.filter((p) => p.price >= Number(filters.minPrice));
      }
      if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
        products = products.filter((p) => p.price <= Number(filters.maxPrice));
      }
      if (filters.minRating !== null && filters.minRating !== undefined) {
        products = products.filter((p) => (p.rating || 0) >= Number(filters.minRating));
      }

      results.products = products;
    }

    if (searchIn === 'suppliers' || searchIn === 'both') {
      let ref = db.collection('suppliers');

      if (filters.province) {
        ref = ref.where('address.province', '==', filters.province);
      }

      const snap = await ref.get();
      let suppliers = mapDocs(snap);

      const queryLower = query.toLowerCase();
      if (queryLower) {
        suppliers = suppliers.filter((s) =>
          (s.companyName || '').toLowerCase().includes(queryLower)
        );
      }

      results.suppliers = suppliers;
    }

    return results;
  }

  async getSearchFilters() {
    const categoriesSnap = await db.collection('categories').get();
    const categories = mapDocs(categoriesSnap);

    const suppliersSnap = await db.collection('suppliers').get();
    const provincesSet = new Set();
    suppliersSnap.forEach((doc) => {
      const supplier = doc.data();
      const province = supplier?.address?.province;
      if (province) provincesSet.add(province);
    });

    const provinces = Array.from(provincesSet);

    return {
      categories,
      provinces,
      priceRanges: [
        { label: '0 - 10.000', min: 0, max: 10000 },
        { label: '10.000 - 50.000', min: 10000, max: 50000 },
        { label: '50.000+', min: 50000 }
      ]
    };
  }

  async getRelatedProducts(productId) {
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const product = productDoc.data();
    const { categoryId } = product;

    const snap = await db
      .collection('products')
      .where('categoryId', '==', categoryId)
      .where('isActive', '==', true)
      .limit(10)
      .get();

    const related = mapDocs(snap).filter((p) => p.id !== productId);

    return related;
  }

  async getProductsBySupplier(supplierId) {
    const snap = await db
      .collection('products')
      .where('supplierId', '==', supplierId)
      .where('isActive', '==', true)
      .get();

    return mapDocs(snap);
  }

  async getFavoriteSuppliers(resellerId) {
    const favSnap = await db
      .collection('favorites')
      .where('resellerId', '==', resellerId)
      .where('isActive', '==', true)
      .get();

    if (favSnap.empty) {
      return [];
    }

    const favorites = mapDocs(favSnap);
    const productIds = [...new Set(favorites.map((f) => f.productId))];

    const productDocs = await Promise.all(
      productIds.map((pid) => db.collection('products').doc(pid).get())
    );

    const supplierIdsSet = new Set();
    productDocs.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data.supplierId) supplierIdsSet.add(data.supplierId);
      }
    });

    const supplierIds = Array.from(supplierIdsSet);

    if (supplierIds.length === 0) {
      return [];
    }

    const supplierDocs = await Promise.all(
      supplierIds.map((sid) => db.collection('suppliers').doc(sid).get())
    );

    const suppliers = supplierDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    return suppliers;
  }
}

module.exports = new SearchService();