//sebastian panozzo
const multer = require('multer');
const { isImage, isValidSize } = require('../utils/uploadHelper');


const storage = multer.memoryStorage();


const fileFilter = (req, file, cb) => {
  if (isImage(file)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, 
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
    
    if (req.file && !isValidSize(req.file)) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
      });
    }
    
    next();
  });
};

const requireImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere una imagen'
    });
  }
  next();
};

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