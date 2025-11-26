//soria nicolas
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, admin } = require('../../config/firebase');

class AuthService {
    async generateTokens(userId, email, userType) {
        const accessToken = jwt.sign(
        { userId, email, userType },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
        { userId, email, userType },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
        );

        await db.collection('refreshTokens').add({
        userId,
        token: refreshToken,
        isValid: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        )
        });
        return { accessToken, refreshToken };
    }
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

    const { accessToken, refreshToken } = await this.generateTokens(userId, email, 'reseller');

    return {
      token:accessToken,
      refreshToken,
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

    const { accessToken, refreshToken } = await this.generateTokens(userId, email, 'supplier');

    return {
      token: accessToken,
      refreshToken,
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

    const { accessToken, refreshToken } = await this.generateTokens(
    userId,
    userData.email,
    userData.userType
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
      token: accessToken,
      refreshToken,
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
    async logout(userId, token) {
    const refreshTokensRef = db.collection('refreshTokens');
    const tokenSnapshot = await refreshTokensRef
      .where('userId', '==', userId)
      .where('token', '==', token)
      .where('isValid', '==', true)
      .get();

    if (tokenSnapshot.empty) {
      throw new Error('Token no encontrado');
    }

    const batch = db.batch();
    tokenSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isValid: false });
    });
    await batch.commit();

    return { message: 'Logout exitoso' };
  }

  async refreshToken(oldRefreshToken) {
    let decoded;
    
    try {
      decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Refresh token ivalido o expirado');
    }

    const refreshTokensRef = db.collection('refreshTokens');
    const tokenSnapshot = await refreshTokensRef
      .where('token', '==', oldRefreshToken)
      .where('isValid', '==', true)
      .get();

    if (tokenSnapshot.empty) {
      throw new Error('Refresh token no valido');
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    if (tokenData.expiresAt.toDate() < new Date()) {
      await tokenDoc.ref.update({ isValid: false });
      throw new Error('Refresh token expirado');
    }

    await tokenDoc.ref.update({ isValid: false });

    const { accessToken, refreshToken } = await this.generateTokens(
    decoded.userId,
    decoded.email,
    decoded.userType
    );
    return {
        token: accessToken,
        refreshToken
    };
  }
    async forgotPassword(email) {
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).get();
    
    if (userSnapshot.empty) {
        return { message: 'Si el email existe, recibiras un correo con instrucciones' };
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;

    const resetToken = jwt.sign(
        { userId, email, type: 'password-reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    await db.collection('passwordResets').add({
        userId,
        token: resetToken,
        email,
        isUsed: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 60 * 60 * 1000) // 1 hora
        )
    });

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Recuperacion de contraseña - TangoShop',
        html: `
        <h2>Recuperacion de contraseña</h2>
        <p>Has solicitado restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace para continuar:</p>
        <a href="${resetUrl}">Restablecer contraseña</a>
        <p>Este enlace expira en 1 hora.</p>
        <p>Si no solicitaste esto, ignora este correo.</p>
        `
    });

    return { message: 'Si el email existe, recibiras un correo con instrucciones' };
    }

    async resetPassword(token, newPassword) {
    let decoded;
    
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (decoded.type !== 'password-reset') {
        throw new Error('Token invalido');
        }
    } catch (error) {
        throw new Error('Token invalido o expirado');
    }

    const resetTokensRef = db.collection('passwordResets');
    const tokenSnapshot = await resetTokensRef
        .where('token', '==', token)
        .where('isUsed', '==', false)
        .get();

    if (tokenSnapshot.empty) {
        throw new Error('Token invalido o ya utilizado');
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    if (tokenData.expiresAt.toDate() < new Date()) {
        throw new Error('Token expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', decoded.email).get();
    
    if (userSnapshot.empty) {
        throw new Error('Usuario no encontrado');
    }

    await userSnapshot.docs[0].ref.update({
        password: hashedPassword,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await tokenDoc.ref.update({ isUsed: true });

    const refreshTokensRef = db.collection('refreshTokens');
    const userTokens = await refreshTokensRef
        .where('userId', '==', decoded.userId)
        .where('isValid', '==', true)
        .get();

    const batch = db.batch();
    userTokens.docs.forEach(doc => {
        batch.update(doc.ref, { isValid: false });
    });
    await batch.commit();

    return { message: 'Contraseña restablecida exitosamente' };
    }
}


module.exports = new AuthService()