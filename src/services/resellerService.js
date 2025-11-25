const { db } = require('../../config/firebase');

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
}

module.exports = new ResellerService();