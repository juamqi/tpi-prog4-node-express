/**
 * Configuración de Firebase Admin SDK
 * 
 * Este módulo inicializa Firebase usando variables de entorno en lugar
 * del archivo serviceAccountKey.json directamente, siguiendo mejores
 * prácticas de seguridad.
 * 
 * Variables de entorno requeridas:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_STORAGE_BUCKET
 */

const admin = require('firebase-admin');

/**
 * Inicializar Firebase Admin SDK
 * 
 * Verifica que las variables de entorno necesarias estén presentes
 * antes de intentar inicializar Firebase
 */
const initializeFirebase = () => {
  // Validar que las variables de entorno estén presentes
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_STORAGE_BUCKET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Faltan las siguientes variables de entorno de Firebase: ${missingVars.join(', ')}\n` +
      'Por favor, configura estas variables en tu archivo .env'
    );
  }

  // Configurar credenciales desde variables de entorno
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
  };

  // Inicializar Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });

  console.log('✅ Firebase Admin SDK inicializado correctamente');
};

// Inicializar Firebase
initializeFirebase();

// Exportar instancias de los servicios de Firebase
const db = admin.firestore();
const storage = admin.storage();
const auth = admin.auth();

module.exports = { admin, db, storage, auth };