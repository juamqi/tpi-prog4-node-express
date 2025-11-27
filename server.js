const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { db } = require('./config/firebase');

const authRoutes = require('./src/routes/authRoutes');
const resellerRoutes = require('./src/routes/resellerRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const favoriteRoutes = require('./src/routes/favoriteRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta views
app.use(express.static(path.join(__dirname, 'views')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.use('/auth', authRoutes);
app.use('/resellers', resellerRoutes);
app.use('/suppliers', supplierRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/reviews', reviewRoutes);
app.use('/notifications', notificationRoutes);
app.use('/search', searchRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});