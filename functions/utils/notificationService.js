const { admin, db } = require('./firebase');

async function createWelcomeNotification(userId, userType) {
  const message = userType === 'reseller'
    ? 'Bienvenido a TangoShop! Explora productos y crea tu catalogo personalizado.'
    : 'Bienvenido a TangoShop! Comienza publicando tus productos.';

  return db.collection('notifications').add({
    userId,
    type: 'welcome',
    title: 'Bienvenido!',
    message,
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}


async function notifySupplierProductFavorited(
  supplierId,
  productId,
  productName,
  resellerName
) {
  return db.collection('notifications').add({
    userId: supplierId,
    type: 'product_favorited',
    title: 'Nuevo favorito!',
    message: `${resellerName} agrego "${productName}" a sus favoritos`,
    data: {
      productId,
      productName,
      resellerName,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifySupplierNewReview(
  supplierId,
  productId,
  productName,
  resellerName,
  rating,
  comment
) {
  return db.collection('notifications').add({
    userId: supplierId,
    type: 'new_review',
    title: 'Nueva reseña recibida',
    message: `${resellerName} dejo una reseña de ${rating} en "${productName}"`,
    data: {
      productId,
      productName,
      resellerName,
      rating,
      comment,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifyProductUpdated(resellerId, productId, productName, changes) {
  const changesList = changes.map((c) => c.field).join(', ');

  return db.collection('notifications').add({
    userId: resellerId,
    type: 'product_updated',
    title: 'Producto actualizado',
    message: `"${productName}" fue actualizado (${changesList})`,
    data: {
      productId,
      productName,
      changes,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifyFavoriteAdded(
  resellerId,
  productId,
  productName,
  markupType,
  markupValue,
  finalPrice
) {
  const markupText = markupType === 'fixed' 
    ? `$${markupValue} fijo`
    : `${markupValue}% porcentaje`;

  return db.collection('notifications').add({
    userId: resellerId,
    type: 'favorite_added',
    title: 'Producto agregado a tu catalogo',
    message: `"${productName}" se agreg correctamente con markup ${markupText}. Precio final: $${finalPrice}`,
    data: {
      productId,
      productName,
      markupType,
      markupValue,
      finalPrice,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function notifyMarkupUpdated(
  resellerId,
  productId,
  productName,
  markupType,
  markupValue,
  finalPrice
) {
  const markupText = markupType === 'fixed' 
    ? `$${markupValue} fijo`
    : `${markupValue}% porcentaje`;

  return db.collection('notifications').add({
    userId: resellerId,
    type: 'markup_updated',
    title: 'Markup actualizado',
    message: `"${productName}" se updateo correctamente: markup ${markupText}, precio final: $${finalPrice}`,
    data: {
      productId,
      productName,
      markupType,
      markupValue,
      finalPrice,
    },
    isRead: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

module.exports = {
  createWelcomeNotification,
  notifySupplierProductFavorited,
  notifySupplierNewReview,
  notifyProductUpdated,
  notifyMarkupUpdated,
  notifyFavoriteAdded
};