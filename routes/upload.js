// upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegúrate de que la carpeta uploads/ exista
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const id = req.params.id || 'sin_id';
    const fechaRegistro = req.body.fechaRegistro 
      ? req.body.fechaRegistro.replace(/[:.]/g, '-')  // Evita caracteres no válidos en nombres de archivo
      : 'fecha_desconocida';

    const baseNombre = `${id}_${fechaRegistro}`;
    const extension = path.extname(file.originalname);
    const nombreArchivo = `${baseNombre}${extension}`;

    // Elimina archivos con el mismo nombre base pero distinta extensión
    const posiblesExtensiones = ['.jpg', '.jpeg', '.png', '.gif'];
    posiblesExtensiones.forEach(ext => {
      const ruta = path.join(uploadDir, `${baseNombre}${ext}`);
      if (fs.existsSync(ruta)) {
        fs.unlinkSync(ruta);
      }
    });

    cb(null, nombreArchivo);
  }
});

// Filtro de tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mime = allowedTypes.test(file.mimetype);
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mime && ext) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpg, jpeg, png, gif)'));
  }
};

// Límite de tamaño y configuración final de Multer
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

module.exports = upload;
