//soria nicolas
const { db } = require('../../config/firebase');
const { admin } = require('../../config/firebase');

class ResellerService {
  async getProfile(userId) {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();

    if (userData.userType !== 'reseller') {
      throw new Error('No eres un revendedor');
    }

    const resellerDoc = await db.collection('resellers').doc(userId).get();
    
    if (!resellerDoc.exists) {
      throw new Error('Datos de revendedor no encontrados');
    }

    const resellerData = resellerDoc.data();

    return {
      userId,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      website: userData.website,
      photoURL: userData.photoURL,
      userType: userData.userType,
      markupType: resellerData.markupType,
      defaultMarkupValue: resellerData.defaultMarkupValue,
      catalogSettings: resellerData.catalogSettings,
      stats: resellerData.stats,
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

  if (userData.userType !== 'reseller') {
    throw new Error('No eres un revendedor');
  }

  const allowedFields = ['firstName', 'lastName', 'phone', 'website', 'photoURL'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    throw new Error('No hay campos validos para actualizar');
  }

  updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('users').doc(userId).update(updates);

  return await this.getProfile(userId);
}
async updatePhoto(userId, photoURL) {
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('Usuario no encontrado');
  }

  const userData = userDoc.data();

  if (userData.userType !== 'reseller') {
    throw new Error('No eres un revendedor');
  }

  await db.collection('users').doc(userId).update({
    photoURL: photoURL,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return await this.getProfile(userId);
}
async getResellerById(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('Revendedor no encontrado');
  }

  const userData = userDoc.data();

  if (userData.userType !== 'reseller') {
    throw new Error('Revendedor no encontrado');
  }

  if (!userData.isActive) {
    throw new Error('Revendedor no encontrado');
  }

  const resellerDoc = await db.collection('resellers').doc(userId).get();
  
  if (!resellerDoc.exists) {
    throw new Error('Revendedor no encontrado');
  }

  const resellerData = resellerDoc.data();
    return {
    userId,
    firstName: userData.firstName,
    lastName: userData.lastName,
    photoURL: userData.photoURL,
    website: userData.website,
    stats: {
      totalFavorites: resellerData.stats.totalFavorites
    },
    catalogSettings: {
      isPublic: resellerData.catalogSettings.isPublic
    },
    createdAt: userData.createdAt
  };
}
async listResellers(page = 1, limit = 10) {
  const usersQuery = db.collection('users')
    .where('userType', '==', 'reseller')
    .where('isActive', '==', true);

  const usersSnapshot = await usersQuery.get();
  
  const totalResellers = usersSnapshot.size;

  const allUsers = usersSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate() || new Date(0);
      const dateB = b.createdAt?.toDate() || new Date(0);
      return dateB - dateA;
    });

  // pagina por memoria xq no tiene indice en firebase ver si se modifica
  const offset = (page - 1) * limit;
  const paginatedUsers = allUsers.slice(offset, offset + limit);

  const resellers = [];

  for (const userData of paginatedUsers) {
    const userId = userData.id;
    const resellerDoc = await db.collection('resellers').doc(userId).get();
    
    if (resellerDoc.exists) {
      const resellerData = resellerDoc.data();
      
      resellers.push({
        userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        photoURL: userData.photoURL,
        website: userData.website,
        stats: {
          totalFavorites: resellerData.stats.totalFavorites
        },
        catalogSettings: {
          isPublic: resellerData.catalogSettings.isPublic
        },
        createdAt: userData.createdAt
      });
    }
  }

  const totalPages = Math.ceil(totalResellers / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    resellers,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalResellers,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage
    }
  };
}
async deactivateAccount(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('Usuario no encontrado');
  }

  const userData = userDoc.data();

  if (userData.userType !== 'reseller') {
    throw new Error('No eres un revendedor');
  }

  if (!userData.isActive) {
    throw new Error('La cuenta ya está desactivada');
  }

  await db.collection('users').doc(userId).update({
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  const refreshTokensRef = db.collection('refreshTokens');
  const userTokens = await refreshTokensRef
    .where('userId', '==', userId)
    .where('isValid', '==', true)
    .get();

  const batch = db.batch();
  userTokens.docs.forEach(doc => {
    batch.update(doc.ref, { isValid: false });
  });
  await batch.commit();

  await db.collection('notifications').add({
    userId: userId,
    type: 'account_deactivated',
    message: 'Tu cuenta ha sido desactivada. Contacta soporte si deseas reactivarla.',
    data: {
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { message: 'Cuenta desactivada exitosamente' };
}
async getDetailedStats(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    throw new Error('Usuario no encontrado');
  }

  const userData = userDoc.data();

  if (userData.userType !== 'reseller') {
    throw new Error('No eres un revendedor');
  }

  const resellerDoc = await db.collection('resellers').doc(userId).get();
  
  if (!resellerDoc.exists) {
    throw new Error('Datos de revendedor no encontrados');
  }

  const resellerData = resellerDoc.data();

  const favoritesSnapshot = await db.collection('favorites')
    .where('resellerId', '==', userId)
    .where('isActive', '==', true)
    .get();

  const totalFavorites = favoritesSnapshot.size;

  if (totalFavorites === 0) {
    return {
      totalFavorites: 0,
      favoritesByCategory: [],
      favoritesBySupplier: [],
      priceRange: {
        min: 0,
        max: 0,
        average: 0
      },
      lastFavoriteAdded: null
    };
  }

  const categoriesMap = {};
  const suppliersMap = {};
  const prices = [];
  let lastAddedDate = null;

  for (const favoriteDoc of favoritesSnapshot.docs) {
    const favoriteData = favoriteDoc.data();
    const { productId, addedAt } = favoriteData;

    const productDoc = await db.collection('products').doc(productId).get();
    
    if (!productDoc.exists || !productDoc.data().isActive) {
      continue;
    }

    const productData = productDoc.data();
    const { categoryId, supplierId, price: basePrice } = productData;

    let markupType = favoriteData.markupType;
    let markupValue = favoriteData.markupValue;

    if (markupType === 'default') {
      markupType = resellerData.markupType;
      markupValue = resellerData.defaultMarkupValue;
    }

    let finalPrice = basePrice;
    if (markupType === 'fixed') {
      finalPrice = basePrice + markupValue;
    } else if (markupType === 'percentage') {
      finalPrice = basePrice * (1 + markupValue / 100);
    }
    finalPrice = Math.round(finalPrice * 100) / 100;

    prices.push(finalPrice);

    if (!categoriesMap[categoryId]) {
      const categoryDoc = await db.collection('categories').doc(categoryId).get();
      categoriesMap[categoryId] = {
        categoryId,
        categoryName: categoryDoc.exists ? categoryDoc.data().name : 'Sin categoría',
        count: 0
      };
    }
    categoriesMap[categoryId].count++;

    if (!suppliersMap[supplierId]) {
      const supplierDoc = await db.collection('suppliers').doc(supplierId).get();
      suppliersMap[supplierId] = {
        supplierId,
        supplierName: supplierDoc.exists ? supplierDoc.data().companyName : 'Desconocido',
        count: 0
      };
    }
    suppliersMap[supplierId].count++;

    if (addedAt) {
      const addedDate = addedAt.toDate();
      if (!lastAddedDate || addedDate > lastAddedDate) {
        lastAddedDate = addedDate;
      }
    }
  }
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  const favoritesByCategory = Object.values(categoriesMap)
    .sort((a, b) => b.count - a.count);

  const favoritesBySupplier = Object.values(suppliersMap)
    .sort((a, b) => b.count - a.count);

  return {
    totalFavorites,
    favoritesByCategory,
    favoritesBySupplier,
    priceRange: {
      min: Math.round(minPrice * 100) / 100,
      max: Math.round(maxPrice * 100) / 100,
      average: Math.round(avgPrice * 100) / 100
    },
    lastFavoriteAdded: lastAddedDate
  };
}
}

module.exports = new ResellerService();