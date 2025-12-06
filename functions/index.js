require('dotenv').config();

const functions = require('firebase-functions');
const { admin, db, storage } = require('./utils/firebase');
const emailService = require('./utils/emailService');
const notificationService = require('./utils/notificationService');

//onusercreated
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const userData = snap.data();
    const { email, userType, firstName, lastName, companyName } = userData;


    try {
      const displayName = userType === 'reseller' 
        ? `${firstName} ${lastName}`
        : companyName;

      await emailService.sendWelcomeEmail(email, displayName, userType);

      const collectionName = userType === 'reseller' ? 'resellers' : 'suppliers';
      
      const specificData = {
        userId,
        email,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (userType === 'reseller') {
        specificData.firstName = firstName;
        specificData.lastName = lastName;
        specificData.phone = userData.phone || '';
        specificData.website = userData.website || '';
        specificData.photoURL = '';
        specificData.markupType = 'percentage';
        specificData.defaultMarkupValue = 0;
        specificData.catalogSettings = {
          isPublic: true,
          lastGenerated: null,
          catalogUrl: '',
        };
        specificData.stats = {
          totalFavorites: 0,
        };
        specificData.isActive = true;
      } else if (userType === 'supplier') {
        specificData.companyName = companyName;
        specificData.phone = userData.phone || '';
        specificData.website = userData.website || '';
        specificData.photoURL = '';
        specificData.address = userData.address || {};
        specificData.stats = {
          totalProducts: 0,
          avgRating: 0,
          totalReviews: 0,
          totalFavorites: 0,
        };
        specificData.isActive = true;
      }

      await db.collection(collectionName).doc(userId).set(specificData);

      await notificationService.createWelcomeNotification(userId, userType);

      return { success: true };
    } catch (error) {
      console.error('Error en onUserCreated:', error);
      throw error;
    }
  });

//onproductfavorited
exports.onProductFavorited = functions.firestore
  .document('favorites/{favoriteId}')
  .onCreate(async (snap, context) => {
    const { favoriteId } = context.params;
    const favoriteData = snap.data();
    const { productId, resellerId, supplierId } = favoriteData;

    try {
      const productRef = db.collection('products').doc(productId);
      await productRef.update({
        favoritesCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const supplierRef = db.collection('suppliers').doc(supplierId);
      await supplierRef.update({
        'stats.totalFavorites': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const resellerRef = db.collection('resellers').doc(resellerId);
      await resellerRef.update({
        'stats.totalFavorites': admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const [productDoc, resellerDoc] = await Promise.all([
        productRef.get(),
        resellerRef.get(),
      ]);

      const productName = productDoc.data()?.name || 'Producto';
      const resellerName = `${resellerDoc.data()?.firstName} ${resellerDoc.data()?.lastName}`;

      await notificationService.notifySupplierProductFavorited(
        supplierId,
        productId,
        productName,
        resellerName
      );

      return { success: true };
    } catch (error) {
      console.error('Error en onProductFavorited:', error);
      throw error;
    }
  });

//onreview
exports.onReviewCreated = functions.firestore
  .document('reviews/{reviewId}')
  .onCreate(async (snap, context) => {
    const { reviewId } = context.params;
    const reviewData = snap.data();
    const { productId, supplierId, resellerId, rating, comment } = reviewData;

    try {
      // ✅ AGREGA ESTA VALIDACIÓN
      console.log('Review data:', { productId, supplierId, resellerId, rating, comment });

      if (!productId || !supplierId || !resellerId) {
        console.error('Datos faltantes en la review:', { productId, supplierId, resellerId });
        throw new Error('Review incompleta: faltan campos requeridos');
      }

      const reviewsSnapshot = await db
        .collection('reviews')
        .where('productId', '==', productId)
        .get();

      const totalReviews = reviewsSnapshot.size;
      let sumRatings = 0;

      reviewsSnapshot.forEach((doc) => {
        sumRatings += doc.data().rating;
      });

      const avgRating = totalReviews > 0 ? sumRatings / totalReviews : 0;

      const productRef = db.collection('products').doc(productId);
      await productRef.update({
        rating: parseFloat(avgRating.toFixed(2)),
        reviewCount: totalReviews,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const supplierProductsSnapshot = await db
        .collection('products')
        .where('supplierId', '==', supplierId)
        .get();

      let supplierTotalReviews = 0;
      let supplierSumRatings = 0;

      for (const productDoc of supplierProductsSnapshot.docs) {
        const productData = productDoc.data();
        supplierTotalReviews += productData.reviewCount || 0;
        supplierSumRatings += (productData.rating || 0) * (productData.reviewCount || 0);
      }

      const supplierAvgRating = supplierTotalReviews > 0 
        ? supplierSumRatings / supplierTotalReviews 
        : 0;

      const supplierRef = db.collection('suppliers').doc(supplierId);
      await supplierRef.update({
        'stats.avgRating': parseFloat(supplierAvgRating.toFixed(2)),
        'stats.totalReviews': supplierTotalReviews,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const [productDoc, resellerDoc] = await Promise.all([
        productRef.get(),
        db.collection('resellers').doc(resellerId).get(),
      ]);

      const productName = productDoc.data()?.name || 'Producto';
      const resellerName = `${resellerDoc.data()?.firstName} ${resellerDoc.data()?.lastName}`;

      // ✅ AGREGA LOG ANTES DE CREAR LA NOTIFICACIÓN
      console.log('Creando notificación con:', { supplierId, productId, productName, resellerName, rating });

      await notificationService.notifySupplierNewReview(
        supplierId,
        productId,
        productName,
        resellerName,
        rating,
        comment
      );

      // ✅ CONFIRMA QUE SE CREÓ
      console.log('Notificación de review creada exitosamente');

      return { success: true };
    } catch (error) {
      console.error('Error en onReviewCreated:', error);
      throw error;
    }
  });


//notificaciones de agregar producto al catalogo
exports.onFavoriteAdded = functions.firestore
  .document('favorites/{favoriteId}')
  .onCreate(async (snap, context) => {
    const { favoriteId } = context.params;
    const favoriteData = snap.data();
    const { productId, resellerId, markupType, markupValue } = favoriteData;

    try {
      const productDoc = await db.collection('products').doc(productId).get();
      
      if (!productDoc.exists) {
        console.error('Producto no encontrado');
        return null;
      }

      const productData = productDoc.data();
      const basePrice = productData.price;

      const resellerDoc = await db.collection('resellers').doc(resellerId).get();
      const resellerData = resellerDoc.data();

      let finalPrice = basePrice;
      let appliedMarkupType = markupType;
      let appliedMarkupValue = markupValue;

      if (markupType === 'default') {
        appliedMarkupType = resellerData.markupType;
        appliedMarkupValue = resellerData.defaultMarkupValue;
      }

      if (appliedMarkupType === 'fixed') {
        finalPrice = basePrice + appliedMarkupValue;
      } else if (appliedMarkupType === 'percentage') {
        finalPrice = basePrice * (1 + appliedMarkupValue / 100);
      }

      finalPrice = Math.round(finalPrice * 100) / 100;

      await notificationService.notifyFavoriteAdded(
        resellerId,
        productId,
        productData.name,
        appliedMarkupType,
        appliedMarkupValue,
        finalPrice
      );

      return { success: true };
    } catch (error) {
      console.error('Error en onFavoriteAdded:', error);
      throw error;
    }
  });

exports.onFavoriteMarkupUpdated = functions.firestore
  .document('favorites/{favoriteId}')
  .onUpdate(async (change, context) => {
    const { favoriteId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    try {
      if (beforeData.markupType === afterData.markupType && 
          beforeData.markupValue === afterData.markupValue) {
        console.log('No hubo cambios en el markup');
        return null;
      }

      const { productId, resellerId, markupType, markupValue } = afterData;
      const productDoc = await db.collection('products').doc(productId).get();
      
      if (!productDoc.exists) {
        console.error('Producto no encontrado');
        return null;
      }

      const productData = productDoc.data();
      const basePrice = productData.price;

      const resellerDoc = await db.collection('resellers').doc(resellerId).get();
      const resellerData = resellerDoc.data();

      let finalPrice = basePrice;
      let appliedMarkupType = markupType;
      let appliedMarkupValue = markupValue;

      if (markupType === 'default') {
        appliedMarkupType = resellerData.markupType;
        appliedMarkupValue = resellerData.defaultMarkupValue;
      }

      if (appliedMarkupType === 'fixed') {
        finalPrice = basePrice + appliedMarkupValue;
      } else if (appliedMarkupType === 'percentage') {
        finalPrice = basePrice * (1 + appliedMarkupValue / 100);
      }

      finalPrice = Math.round(finalPrice * 100) / 100;

      await notificationService.notifyMarkupUpdated(
        resellerId,
        productId,
        productData.name,
        appliedMarkupType,
        appliedMarkupValue,
        finalPrice
      );

      return { success: true };
    } catch (error) {
      console.error('Error en onFavoriteMarkupUpdated:', error);
      throw error;
    }
  });

//onproductupdated
exports.onProductUpdated = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const { productId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();


    try {
      const changes = [];

      if (beforeData.name !== afterData.name) {
        changes.push({
          field: 'nombre',
          oldValue: beforeData.name,
          newValue: afterData.name,
        });
      }

      if (beforeData.price !== afterData.price) {
        changes.push({
          field: 'precio',
          oldValue: beforeData.price,
          newValue: afterData.price,
        });
      }

      if (beforeData.description !== afterData.description) {
        changes.push({
          field: 'descripcion',
          oldValue: beforeData.description,
          newValue: afterData.description,
        });
      }

      if (beforeData.photoURL !== afterData.photoURL) {
        changes.push({
          field: 'foto',
          oldValue: 'foto anterior',
          newValue: 'foto nueva',
        });
      }
      if (changes.length === 0) {
        console.log('No hay cambios relevantes');
        return null;
      }

      const favoritesSnapshot = await db
        .collection('favorites')
        .where('productId', '==', productId)
        .get();

      if (favoritesSnapshot.empty) {
        console.log('El producto no está en favoritos de ningún revendedor');
        return null;
      }

      const notificationPromises = [];

      favoritesSnapshot.forEach((favoriteDoc) => {
        const { resellerId } = favoriteDoc.data();
        
        notificationPromises.push(
          notificationService.notifyProductUpdated(
            resellerId,
            productId,
            afterData.name,
            changes
          )
        );
      });

      await Promise.all(notificationPromises);
      console.log(`Notificaciones enviadas a ${favoritesSnapshot.size} revendedores`);

      await change.after.ref.update({
        lastModified: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, notificationsSent: favoritesSnapshot.size };
    } catch (error) {
      console.error('Error en onProductUpdated:', error);
      throw error;
    }
  });