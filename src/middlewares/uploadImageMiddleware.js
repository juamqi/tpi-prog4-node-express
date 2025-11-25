/**
 * Middleware para manejo de uploads de imágenes
 * 
 * Utiliza Multer para procesar archivos multipart/form-data
 * y valida que sean imágenes con tamaño apropiado
 */

const multer = require('multer');
const { isImage, isValidSize } = require('../utils/uploadHelper');

/**
 * Configuración de Multer para almacenamiento en memoria
 * Los archivos se guardan en buffer para luego subirlos a Firebase Storage
 */
const storage = multer.memoryStorage();

/**
 * Filtro de archivos para aceptar solo imágenes
 */
const fileFilter = (req, file, cb) => {
  if (isImage(file)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'), false);
  }
};

/**
 * Configuración de Multer
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

/**
 * Middleware para subir una sola imagen
 * Campo de formulario: 'photo'
 * 
 * @example
 * router.post('/products', authenticate, uploadImage, controller.create)
 */
const uploadImage = (req, res, next) => {
  const uploadSingle = upload.single('photo');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Error al subir archivo: ${err.message}`
      });
    } else if (err) {
      // Error personalizado (del fileFilter)
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Validación adicional del tamaño
    if (req.file && !isValidSize(req.file)) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
      });
    }
    
    next();
  });
};

/**
 * Middleware para validar que se haya subido una imagen
 * Debe usarse después de uploadImage
 */
const requireImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere una imagen'
    });
  }
  next();
};

/**
 * Middleware para subir imagen de forma opcional
 * No genera error si no se proporciona archivo
 */
const uploadOptionalImage = (req, res, next) => {
  const uploadSingle = upload.single('photo');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: `Error al subir archivo: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Validación adicional del tamaño solo si hay archivo
    if (req.file && !isValidSize(req.file)) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
      });
    }
    
    next();
  });
};

module.exports = {
  uploadImage,
  requireImage,
  uploadOptionalImage
};