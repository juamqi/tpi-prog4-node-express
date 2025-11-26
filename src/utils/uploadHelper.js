//sebastian panozzo
const { storage } = require('../../config/firebase');
const path = require('path');

/**
 * Sube un archivo a Firebase Storage
 * 
 * @param {Object} file - Objeto de archivo de Multer
 * @param {string} folder - Carpeta destino en Storage ('products', 'users', etc.)
 * @param {string} [customName] - Nombre personalizado del archivo (opcional)
 * @returns {Promise<string>} URL pública del archivo subido
 * 
 * @example
 * const photoURL = await uploadFile(req.file, 'products', productId);
 */
const uploadFile = async (file, folder, customName = null) => {
  try {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const fileName = customName 
      ? `${customName}${extension}`
      : `${timestamp}-${file.originalname.replace(/\s/g, '_')}`;
    
    const filePath = `${folder}/${fileName}`;

    const bucket = storage.bucket();
    const fileUpload = bucket.file(filePath);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: timestamp
        }
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(new Error(`Error al subir archivo: ${error.message}`));
      });

      stream.on('finish', async () => {
        try {
          await fileUpload.makePublic(); 
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
          resolve(publicUrl);
        } catch (error) {
          reject(new Error(`Error al generar URL pública: ${error.message}`));
        }
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    throw new Error(`Error en uploadFile: ${error.message}`);
  }
};

/**
 * Elimina un archivo de Firebase Storage
 * 
 * @param {string} fileUrl - URL del archivo a eliminar
 * @returns {Promise<void>}
 * 
 * @example
 * await deleteFile(product.photoURL);
 */
const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl) return;

    const bucket = storage.bucket();
    const baseUrl = `https://storage.googleapis.com/${bucket.name}/`;
    
    if (!fileUrl.startsWith(baseUrl)) {
      console.warn('URL no corresponde al bucket de Storage configurado');
      return;
    }

    const filePath = fileUrl.replace(baseUrl, '');
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    
    if (exists) {
      await file.delete();
      console.log(`Archivo eliminado: ${filePath}`);
    } else {
      console.warn(`Archivo no existe: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error al eliminar archivo: ${error.message}`);
  }
};

/**
 * Actualiza un archivo en Firebase Storage
 * Elimina el archivo anterior y sube el nuevo
 * 
 * @param {Object} newFile - Nuevo archivo de Multer
 * @param {string} oldFileUrl - URL del archivo anterior
 * @param {string} folder - Carpeta destino
 * @param {string} [customName] - Nombre personalizado
 * @returns {Promise<string>} URL del nuevo archivo
 * 
 * @example
 * const newPhotoURL = await updateFile(req.file, product.photoURL, 'products', productId);
 */
const updateFile = async (newFile, oldFileUrl, folder, customName = null) => {
  try {
    const newFileUrl = await uploadFile(newFile, folder, customName);
    
    if (oldFileUrl) {
      deleteFile(oldFileUrl).catch(err => {
        console.error('Error al eliminar archivo anterior:', err);
      });
    }
    
    return newFileUrl;
  } catch (error) {
    throw new Error(`Error al actualizar archivo: ${error.message}`);
  }
};

/**
 * Valida que el archivo sea una imagen
 * 
 * @param {Object} file - Objeto de archivo de Multer
 * @returns {boolean}
 */
const isImage = (file) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return file && allowedMimes.includes(file.mimetype);
};

/**
 * Valida el tamaño del archivo
 * 
 * @param {Object} file - Objeto de archivo de Multer
 * @param {number} maxSizeMB - Tamaño máximo en MB (por defecto 5MB)
 * @returns {boolean}
 */
const isValidSize = (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file && file.size <= maxSizeBytes;
};

module.exports = {
  uploadFile,
  deleteFile,
  updateFile,
  isImage,
  isValidSize
};