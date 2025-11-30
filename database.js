const mysql = require('mysql2');
require('dotenv').config();  // Para cargar las variables de entorno


// Crear una conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,  // "localhost" o la IP de tu servidor
  user: process.env.DB_USER,  // El nombre de usuario de tu base de datos
  password: process.env.DB_PASS,  // La contraseña de tu base de datos
  database: process.env.DB_NAME,  // El nombre de la base de datos
  port: process.env.DB_PORT,  // El puerto por defecto es 3306
});

// Verificar si la conexión fue exitosa
connection.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err);
    return;
  }
  console.log('✅ Conexión exitosa a la base de datos MySQL');
});

// Exportar la conexión para usarla en otras partes de tu aplicación
module.exports = connection;
