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
    async registerSupplier(userData) {
    const { email, password, companyName, phone, website, address } = userData;

    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).get();
    
    if (!existingUser.empty) {
      throw new Error('El email ya esta registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userDoc = await usersRef.add({
      email,
      password: hashedPassword,
      firstName: companyName,
      lastName: '',
      userType: 'supplier',
      phone: phone,
      website: website || '',
      photoURL: '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const userId = userDoc.id;

    await db.collection('suppliers').doc(userId).set({
      userId: userId,
      companyName: companyName,
      address: {
        province: address.province,
        city: address.city,
        street: address.street,
        number: address.number
      },
      stats: {
        totalProducts: 0,
        avgRating: 0,
        totalReviews: 0,
        totalFavorites: 0
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('notifications').add({
      userId: userId,
      type: 'welcome',
      message: 'Bienvenido a TangoShopm comienza a gestionar tus productos.',
      data: {},
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const token = jwt.sign(
      { userId, email, userType: 'supplier' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return {
      token,
      user: {
        userId,
        email,
        companyName,
        userType: 'supplier',
        phone,
        website: website || '',
        address
      }
    };
  }
    async login(credentials) {
    const { email, password } = credentials;

    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      throw new Error('Credenciales invalidas');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    if (!userData.isActive) {
      throw new Error('Cuenta desactivada');
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    
    if (!isPasswordValid) {
      throw new Error('Credenciales invalidas');
    }

    const token = jwt.sign(
      { userId, email: userData.email, userType: userData.userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    let additionalData = {};

    if (userData.userType === 'reseller') {
      const resellerDoc = await db.collection('resellers').doc(userId).get();
      if (resellerDoc.exists) {
        additionalData = resellerDoc.data();
      }
    } else if (userData.userType === 'supplier') {
      const supplierDoc = await db.collection('suppliers').doc(userId).get();
      if (supplierDoc.exists) {
        additionalData = supplierDoc.data();
      }
    }

    return {
      token,
      user: {
        userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        phone: userData.phone,
        website: userData.website,
        photoURL: userData.photoURL,
        ...additionalData
      }
    };
  }
}

module.exports = new AuthService()