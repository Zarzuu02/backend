const mysql = require('mysql2');
require('dotenv').config();  // Cargar variables de entorno

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
  host: brygzffuvkjbzixggbaf-mysql.services.clever-cloud.com,    // "localhost" o IP del servidor
  user: ufm0m7fgcymt85zh,    // Usuario de la base de datos
  password: IGBnU0ly3Qb90c5yjcvZ, // Contraseña
  database: brygzffuvkjbzixggbaf, // Nombre de la base de datos
  port: 3306 || 3306, // Puerto por defecto 3306
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
