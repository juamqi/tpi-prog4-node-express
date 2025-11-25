/**
 * Servidor Principal - TangoShop API
 * 
 * Punto de entrada de la aplicación
 * Configura Express y todos los middlewares necesarios
 */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar configuración de Firebase
const { db } = require('../config/firebase');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const resellerRoutes = require('./routes/resellerRoutes');
const productRoutes = require('./routes/productRoutes'); // ⭐ NUEVO - Alumno 3
const favoriteRoutes = require('./routes/favoriteRoutes'); // ⭐ NUEVO - Alumno 3

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middlewares globales
 */
app.use(cors()); // Habilitar CORS
app.use(express.json()); // Parsear JSON en body
app.use(express.urlencoded({ extended: true })); // Parsear form data

/**
 * Ruta raíz - Health check
 */
app.get('/', (req, res) => {
  res.json({
    message: 'TangoShop API funcionando correctamente',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      resellers: '/resellers',
      products: '/products',
      favorites: '/favorites'
    }
  });
});

/**
 * Registro de rutas
 */
app.use('/auth', authRoutes); // Rutas de autenticación - Alumno 1
app.use('/resellers', resellerRoutes); // Rutas de revendedores - Alumno 1
app.use('/products', productRoutes); // Rutas de productos - Alumno 3 ⭐ NUEVO
app.use('/favorites', favoriteRoutes); // Rutas de favoritos - Alumno 3 ⭐ NUEVO

/**
 * Middleware para rutas no encontradas (404)
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

/**
 * Middleware global de manejo de errores
 */
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Iniciar servidor
 */
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🚀 TangoShop API');
  console.log('==========================================');
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('==========================================');
  console.log('📋 Endpoints disponibles:');
  console.log('  - POST   /auth/register/reseller');
  console.log('  - POST   /auth/register/supplier');
  console.log('  - POST   /auth/login');
  console.log('  - GET    /resellers/profile');
  console.log('  - POST   /products');
  console.log('  - GET    /products');
  console.log('  - POST   /favorites');
  console.log('  - GET    /favorites');
  console.log('==========================================');
});

module.exports = app;