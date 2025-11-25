const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { db } = require('./config/firebase');
const authRoutes = require('./src/routes/authRoutes');
const resellerRoutes = require('./src/routes/resellerRoutes');


const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'TangoShop API funcion',
    status: 'online',
    version: '1.0.0'
  });
});

app.use('/auth', authRoutes);
app.use('/resellers', resellerRoutes);
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});