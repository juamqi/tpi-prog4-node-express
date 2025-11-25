/**
 * Configuración de Firebase Admin SDK
 * 
 * Este módulo inicializa Firebase usando el archivo serviceAccountKey.json
 * mediante una referencia en las variables de entorno, siguiendo mejores
 * prácticas de seguridad.
 * 
 * Variables de entorno requeridas:
 * - FIREBASE_SERVICE_ACCOUNT_PATH: Ruta al archivo serviceAccountKey.json
 * - FIREBASE_STORAGE_BUCKET: Bucket de almacenamiento de Firebase
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

/**
 * Inicializar Firebase Admin SDK
 * 
 * Lee las credenciales desde el archivo JSON referenciado en .env
 */
const initializeFirebase = () => {
  try {
    // Verificar que exista la ruta al archivo de credenciales
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      throw new Error(
        'La variable de entorno FIREBASE_SERVICE_ACCOUNT_PATH no está configurada.\n' +
        'Por favor, agrega esta línea a tu archivo .env:\n' +
        'FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json'
      );
    }

    // Construir ruta absoluta al archivo de credenciales
    const serviceAccountPath = path.resolve(
      __dirname, 
      '..', 
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    );

    // Verificar que el archivo existe
    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `No se encuentra el archivo de credenciales de Firebase en: ${serviceAccountPath}\n` +
        'Verifica que el archivo serviceAccountKey.json existe en la raíz del proyecto.'
      );
    }

    // Leer el archivo de credenciales
    const serviceAccount = require(serviceAccountPath);

    // Verificar que el storage bucket esté configurado
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 
                         `${serviceAccount.project_id}.appspot.com`;

    // Inicializar Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket
    });

    console.log('✅ Firebase Admin SDK inicializado correctamente');
    console.log(`📁 Project ID: ${serviceAccount.project_id}`);
    console.log(`🪣 Storage Bucket: ${storageBucket}`);

  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error.message);
    process.exit(1); // Detener la aplicación si Firebase no se puede inicializar
  }
};

// Inicializar Firebase
initializeFirebase();

// Exportar instancias de los servicios de Firebase
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

module.exports = { admin, db, storage, auth };