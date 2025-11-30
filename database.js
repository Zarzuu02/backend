const mysql = require('mysql2');
require('dotenv').config();  // Cargar variables de entorno

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
  host: process.env.DB_HOST,    // "localhost" o IP del servidor
  user: process.env.DB_USER,    // Usuario de la base de datos
  password: process.env.DB_PASS, // Contraseña
  database: process.env.DB_NAME, // Nombre de la base de datos
  port: process.env.DB_PORT || 3306, // Puerto por defecto 3306
});

// Verificar si la conexión fue exitosa
connection.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err.message);
    return;
  }
  console.log('✅ Conexión exitosa a la base de datos MySQL');
});

// Manejo de errores de conexión durante la ejecución
connection.on('error', (err) => {
  console.error('❌ Error de conexión MySQL:', err.code);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('La conexión se perdió. Considera reconectar.');
  }
});

module.exports = connection;
