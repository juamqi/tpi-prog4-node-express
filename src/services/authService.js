const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, admin } = require('../../config/firebase');

class AuthService {
  async registerReseller(userData) {
    const { email, password, firstName, lastName, phone, website } = userData;

    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();
    
    if (!existingUser.empty) {
      throw new Error('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userDoc = await usersRef.add({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      userType: 'reseller',
      phone: phone || '',
      website: website || '',
      photoURL: '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userId = userDoc.id;

    await db.collection('resellers').doc(userId).set({
      userId: userId,
      markupType: 'percentage',
      defaultMarkupValue: 0,
      catalogSettings: {
        isPublic: true,
        lastGenerated: null,
        catalogUrl: ''
      },
      stats: {
        totalFavorites: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('notifications').add({
      userId: userId,
      type: 'welcome',
      message: 'Bienvenido a TangoShop, explora productos y crea tu catalogo.',
      data: {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const token = jwt.sign(
      { userId, email, userType: 'reseller' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        userId,
        email,
        firstName,
        lastName,
        userType: 'reseller',
        phone: phone || '',
        website: website || ''
      }
    };
  }
}

module.exports = new AuthService()