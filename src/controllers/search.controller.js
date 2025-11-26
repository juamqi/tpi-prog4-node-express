const { db } = require("../../config/firebase");

const mapDocs = (snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

exports.advancedSearch = async (req, res, next) => {
  try {
    const { query, searchIn = "both" } = req.query;

    const filters = {
      categoryId: req.query["filters[categoryId]"] ?? null,
      province: req.query["filters[province]"] ?? null,
      minPrice:
        req.query["filters[minPrice]"] !== undefined
          ? Number(req.query["filters[minPrice]"])
          : null,
      maxPrice:
        req.query["filters[maxPrice]"] !== undefined
          ? Number(req.query["filters[maxPrice]"])
          : null,
      minRating:
        req.query["filters[minRating]"] !== undefined
          ? Number(req.query["filters[minRating]"])
          : null,
    };

    const results = {
      products: [],
      suppliers: [],
    };

    if (searchIn === "products" || searchIn === "both") {
      let ref = db.collection("products");

      if (query) {
        ref = ref
          .where("name", ">=", query)
          .where("name", "<=", query + "\uf8ff");
      }

      if (filters.categoryId) {
        ref = ref.where("categoryId", "==", filters.categoryId);
      }

      const snap = await ref.get();
      let products = mapDocs(snap);

      if (filters.minPrice !== null) {
        products = products.filter((p) => p.price >= filters.minPrice);
      }
      if (filters.maxPrice !== null) {
        products = products.filter((p) => p.price <= filters.maxPrice);
      }
      if (filters.minRating !== null) {
        products = products.filter((p) => (p.rating || 0) >= filters.minRating);
      }

      results.products = products;
    }

    if (searchIn === "suppliers" || searchIn === "both") {
      let ref = db.collection("suppliers");

      if (query) {
        ref = ref
          .where("companyName", ">=", query)
          .where("companyName", "<=", query + "\uf8ff");
      }

      if (filters.province) {
        ref = ref.where("address.province", "==", filters.province);
      }

      const snap = await ref.get();
      results.suppliers = mapDocs(snap);
    }

    return res.json(results);
  } catch (error) {
    next(error);
  }
};

exports.getSearchFilters = async (_req, res, next) => {
  try {
    const categoriesSnap = await db.collection("categories").get();
    const categories = mapDocs(categoriesSnap);

    const suppliersSnap = await db.collection("suppliers").get();
    const provincesSet = new Set();
    suppliersSnap.forEach((doc) => {
      const supplier = doc.data();
      const province = supplier?.address?.province;
      if (province) provincesSet.add(province);
    });

    const provinces = Array.from(provincesSet);

    return res.json({
      categories,
      provinces,
      priceRanges: [
        { label: "0 - 10.000", min: 0, max: 10000 },
        { label: "10.000 - 50.000", min: 10000, max: 50000 },
        { label: "50.000+", min: 50000 },
      ],
    });
  } catch (error) {
    next(error);
  }
};

exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const productDoc = await db.collection("products").doc(id).get();
    if (!productDoc.exists) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const product = productDoc.data();
    const { categoryId } = product;

    const snap = await db
      .collection("products")
      .where("categoryId", "==", categoryId)
      .where("isActive", "==", true)
      .limit(10)
      .get();

    const related = mapDocs(snap).filter((p) => p.id !== id);

    return res.json(related);
  } catch (error) {
    next(error);
  }
};

exports.getProductsBySupplier = async (req, res, next) => {
  try {
    const { supplierId } = req.params;

    const snap = await db
      .collection("products")
      .where("supplierId", "==", supplierId)
      .where("isActive", "==", true)
      .get();

    return res.json(mapDocs(snap));
  } catch (error) {
    next(error);
  }
};

exports.getFavoriteSuppliers = async (req, res, next) => {
  try {
    const { id: resellerId } = req.params;

    if (!req.user || req.user.id !== resellerId) {
      return res.status(403).json({
        error: "No tenés permiso para ver los proveedores favoritos de este usuario",
      });
    }

    const favSnap = await db
      .collection("favorites")
      .where("resellerId", "==", resellerId)
      .get();

    if (favSnap.empty) {
      return res.json([]);
    }

    const favorites = mapDocs(favSnap);
    const productIds = [...new Set(favorites.map((f) => f.productId))];

    const productDocs = await Promise.all(
      productIds.map((pid) => db.collection("products").doc(pid).get())
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
      return res.json([]);
    }

    const supplierDocs = await Promise.all(
      supplierIds.map((sid) => db.collection("suppliers").doc(sid).get())
    );

    const suppliers = supplierDocs
      .filter((doc) => doc.exists)
      .map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.json(suppliers);
  } catch (error) {
    next(error);
  }
};
