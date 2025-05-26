const express = require('express');
const connection = require('../database');

const router = express.Router();

// Obtener un cliente por su ID
router.get('/cliente/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      Clientes.id AS id,
      Usuarios.nombre,
      Usuarios.email,
      Usuarios.telefono,
      Usuarios.sexo,
      Usuarios.fecha_registro,
      Usuarios.imagen,
      Usuarios.tipo,
      Usuarios.contrasena
    FROM Clientes
    JOIN Usuarios ON Clientes.usuario_id = Usuarios.id
    WHERE Clientes.id = ?`;

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = results[0];
    const clienteResponse = {
      id: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      sexo: cliente.sexo,
      fecha_registro: cliente.fecha_registro,
      imagen: cliente.imagen,
      tipo: cliente.tipo, // El tipo de cliente
      contrasena: cliente.contrasena // Agregamos la contraseña al objeto de respuesta
    };

    res.json(clienteResponse);
  });
});


// Crear un nuevo cliente
router.post('/agregar', (req, res) => {
  const { nombre, email, contrasena, telefono, sexo } = req.body;

  const queryUsuario = `
    INSERT INTO Usuarios (nombre, email, contrasena, telefono, sexo, tipo) 
    VALUES (?, ?, ?, ?, ?, 'cliente');
  `;

  connection.query(queryUsuario, [nombre, email, contrasena, telefono, sexo], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    const usuarioId = result.insertId;

    const queryCliente = `
      INSERT INTO Clientes (usuario_id) 
      VALUES (?);
    `;

    connection.query(queryCliente, [usuarioId], (err) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: 'Cliente creado con éxito', usuario_id: usuarioId });
    });
  });
});



router.post('/register', (req, res) => {
  const { nombre, email, contrasena, telefono, sexo } = req.body;

  // Consulta para verificar si el email o teléfono ya existen
  const checkQuery = `
    SELECT * FROM Usuarios WHERE email = ? OR telefono = ?;
  `;

  connection.query(checkQuery, [email, telefono], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "El correo o teléfono ya están en uso" });
    }

    // Si no existen, insertamos el usuario en la tabla 'Usuarios'
    const queryUsuario = `
      INSERT INTO Usuarios (nombre, email, contrasena, telefono, sexo) 
      VALUES (?, ?, ?, ?, ?);
    `;

    connection.query(queryUsuario, [nombre, email, contrasena, telefono, sexo], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error al registrar el usuario" });
      }

      // Obtener el ID del usuario insertado
      const usuarioId = result.insertId;

      // Ahora insertamos el cliente en la tabla 'Clientes' y asociamos el 'usuario_id'
      const queryCliente = `
        INSERT INTO Clientes (usuario_id) 
        VALUES (?);
      `;

      connection.query(queryCliente, [usuarioId], (err2, result2) => {
        if (err2) {
          return res.status(500).json({ error: "Error al registrar el cliente" });
        }

        // Responder con el mensaje de éxito y los IDs generados
        res.json({
          message: "Cliente creado correctamente",
          usuario_id: usuarioId,
          cliente_id: result2.insertId
        });
      });
    });
  });
});


router.get('/:usuario_id/citas', (req, res) => {
  const usuarioId = req.params.usuario_id;

  // Paso 1: Obtener cliente_id desde la tabla clientes
  const queryCliente = `
    SELECT id FROM clientes WHERE usuario_id = ?;
  `;

  connection.query(queryCliente, [usuarioId], (err, clienteResults) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar cliente: ' + err.message });
    }

    if (clienteResults.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado para este usuario.' });
    }

    const clienteId = clienteResults[0].id;

    // Paso 2: Obtener todas las citas del cliente, incluyendo info del peluquero
    const queryCitas = `
      SELECT 
        c.id,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
        c.hora,
        c.estado,
        c.cliente_id,
        c.peluquero_id,
        u.nombre AS peluquero_nombre,
        p.especialidad
      FROM citas c
      JOIN peluqueros p ON c.peluquero_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE c.cliente_id = ?
      ORDER BY c.fecha DESC, c.hora DESC;
    `;

    connection.query(queryCitas, [clienteId], (err, citasResults) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las citas: ' + err.message });
      }

      res.status(200).json(citasResults);
    });
  });
});


// router.get('/:usuario_id/citas/pendientes', (req, res) => {
//   const usuarioId = req.params.usuario_id;

//   // Paso 1: Obtener cliente_id desde la tabla clientes
//   const queryCliente = `
//     SELECT id FROM clientes WHERE usuario_id = ?;
//   `;

//   connection.query(queryCliente, [usuarioId], (err, clienteResults) => {
//     if (err) {
//       return res.status(500).json({ error: 'Error al buscar cliente: ' + err.message });
//     }

//     if (clienteResults.length === 0) {
//       return res.status(404).json({ error: 'Cliente no encontrado para este usuario.' });
//     }

//     const clienteId = clienteResults[0].id;

//     // Paso 2: Obtener todas las citas del cliente, incluyendo info del peluquero
//     const queryCitas = `
//       SELECT 
//         c.id,
//         c.fecha,
//         c.hora,
//         c.estado,
//         c.cliente_id,
//         c.peluquero_id,
//         u.nombre AS peluquero_nombre,
//         p.especialidad
//       FROM citas c
//       JOIN peluqueros p ON c.peluquero_id = p.id
//       JOIN usuarios u ON p.usuario_id = u.id
//       WHERE c.cliente_id = ?
//       ORDER BY c.fecha DESC, c.hora DESC;
//     `;

//     connection.query(queryCitas, [clienteId], (err, citasResults) => {
//       if (err) {
//         return res.status(500).json({ error: 'Error al obtener las citas: ' + err.message });
//       }

//       res.status(200).json(citasResults);
//     });
//   });
// });


module.exports = router;
