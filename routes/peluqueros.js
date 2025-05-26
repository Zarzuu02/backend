const express = require('express');
const connection = require('../database');

const router = express.Router();


// Obtener todos peluqueros
router.get('/all', (req, res) => {

  const query = `
    SELECT 
      Usuarios.id AS id,
      Usuarios.nombre,
      Usuarios.email,
      Usuarios.contrasena,
      Usuarios.telefono,
      Usuarios.sexo,
      Usuarios.tipo,
      Usuarios.fecha_registro,
      Usuarios.imagen,
      Peluqueros.especialidad,
      Peluqueros.horario_inicio,
      Peluqueros.horario_fin
    FROM Peluqueros
    JOIN Usuarios ON Peluqueros.usuario_id = Usuarios.id`;

  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Peluquero no encontrado' });
    }

    res.json(results); // ✅ Ya no anida en "usuario", se devuelve directo
  });
});


// Obtener un peluquero por su ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      Usuarios.id AS id,
      Usuarios.nombre,
      Usuarios.email,
      Usuarios.telefono,
      Usuarios.sexo,
      Usuarios.tipo,
      Usuarios.fecha_registro,
      Usuarios.imagen,
      Peluqueros.especialidad,
      Peluqueros.horario_inicio,
      Peluqueros.horario_fin
    FROM Peluqueros
    JOIN Usuarios ON Peluqueros.usuario_id = Usuarios.id
    WHERE Peluqueros.id = ?`;

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Peluquero no encontrado' });
    }

    res.json(results[0]); // ✅ Ya no anida en "usuario", se devuelve directo
  });
});


// Obtener peluqueros disponibles
router.get('/horas-disponibles', (req, res) => {
  const { fecha, peluqueroId } = req.query;  // Recibimos los parámetros de fecha y peluqueroId

  if (!fecha || !peluqueroId) {
    return res.status(400).json({ message: 'Debe proporcionar la fecha y el peluquero_id' });
  }

  // Consulta SQL para obtener las horas disponibles para un peluquero en una fecha específica
  const query = `
    SELECT h.hora
    FROM (
      SELECT '09:00:00' AS hora
      UNION ALL SELECT '10:00:00'
      UNION ALL SELECT '11:00:00'
      UNION ALL SELECT '12:00:00'
      UNION ALL SELECT '13:00:00'
      UNION ALL SELECT '14:00:00'
      UNION ALL SELECT '15:00:00'
      UNION ALL SELECT '16:00:00'
      UNION ALL SELECT '17:00:00'
      UNION ALL SELECT '18:00:00'
    ) AS h
    WHERE h.hora NOT IN (
      SELECT c.hora
      FROM citas c
      WHERE c.peluquero_id = ? AND c.fecha = ? AND c.estado != 'cancelada'
    )
    ORDER BY h.hora;
  `;

  connection.query(query, [peluqueroId, fecha], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Si no hay horas disponibles
    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay horas disponibles para este peluquero en esta fecha' });
    }

    // Devolvemos las horas disponibles
    res.json(results);
  });
});


// Ruta para obtener todas las citas de un peluquero en un día específico
router.get('/citas/dia_hora', (req, res) => { 
  const { fecha } = req.query;  // Fecha proporcionada en el query string
  const { hora } = req.query;

  // Verificamos que se haya proporcionado la fecha
  if (!fecha || !hora) {
    return res.status(400).json({ message: 'Debe proporcionar la fecha y la hora' });
  }

  // Consulta SQL para obtener todas las citas del peluquero en la fecha proporcionada
  const query = `
    SELECT 
      p.id,
      u.nombre,
      u.email,
      u.telefono,
      u.sexo,
      u.imagen,
      p.especialidad,
      p.horario_inicio,
      p.horario_fin
    FROM peluqueros p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id NOT IN (
      SELECT c.peluquero_id
      FROM citas c
      WHERE c.fecha = ? AND c.hora = ? AND c.estado != 'cancelada'
    );
  `;

  // Ejecutamos la consulta con los parámetros proporcionados
  connection.query(query, [fecha, hora], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    // Si no hay citas para ese peluquero en ese día
    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay citas para este peluquero en esta fecha' });
    }

    // Devolvemos las citas encontradas
    res.json(results);
  });
});

// Obtener todas las citas de un peluquero en una fecha específica
router.get('/:id/citas', (req, res) => {
  const { id } = req.params;           // ID del peluquero
  const { fecha } = req.query;         // Fecha en formato 'YYYY-MM-DD'

  if (!fecha) {
    return res.status(400).json({ message: 'Debe proporcionar la fecha' });
  }

  const query = `
    SELECT 
      c.id, 
      DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha, 
      c.hora, 
      c.estado, 
      us.nombre AS cliente_nombre, 
      us.email AS cliente_email, 
      us.telefono AS cliente_telefono
    FROM citas c
    JOIN clientes cl ON c.cliente_id = cl.id
    JOIN usuarios us ON cl.usuario_id = us.id
    WHERE c.peluquero_id = ? AND c.fecha = ?
    ORDER BY c.hora ASC
  `;

  connection.query(query, [id, fecha], (err, results) => {
    if (err) {
      console.error('Error al obtener las citas:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay citas para este peluquero en esta fecha' });
    }

    res.json(results);
  });
});



// router.get('/:id/citas/hoy', (req, res) => {
//   const { id } = req.params; // ID del peluquero

//   if (!id) {
//     return res.status(400).json({ message: 'Debe proporcionar el ID del peluquero' });
//   }

//   const query = `
//     SELECT 
//       c.id,
//       c.fecha,
//       c.hora,
//       c.estado,
//       c.cliente_id,
//       c.peluquero_id,
//       u1.nombre AS cliente_nombre,
//       u2.nombre AS peluquero_nombre
//     FROM citas c
//     JOIN Usuarios u1 ON c.cliente_id = u1.id
//     JOIN Usuarios u2 ON c.peluquero_id = u2.id
//     WHERE c.fecha = CURDATE() AND c.peluquero_id = ?
//     ORDER BY c.hora ASC
//   `;

//   connection.query(query, [id], (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: 'Error al obtener las citas de hoy', detalles: err.message });
//     }

//     res.json(results);
//   });
// });

router.get('/:id/citas/hoy', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Debe proporcionar el ID del usuario' });
  }

  // Primero obtenemos el ID del peluquero correspondiente al usuario
  const obtenerPeluqueroQuery = `
    SELECT id FROM peluqueros WHERE usuario_id = ?
  `;

  connection.query(obtenerPeluqueroQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar el peluquero', detalles: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontró un peluquero para este usuario' });
    }

    const peluqueroId = results[0].id;

    // Ahora obtenemos las citas del día para ese peluquero
    const obtenerCitasQuery = `
      SELECT 
        c.id,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
        c.hora,
        c.estado,
        c.cliente_id,
        c.peluquero_id,
        u1.nombre AS cliente_nombre,
        u2.nombre AS peluquero_nombre
      FROM citas c
      JOIN Usuarios u1 ON c.cliente_id = u1.id
      JOIN Usuarios u2 ON c.peluquero_id = u2.id
      WHERE c.fecha = CURDATE() AND c.peluquero_id = ?
      ORDER BY c.hora ASC
    `;

    connection.query(obtenerCitasQuery, [peluqueroId], (err, citas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las citas de hoy', detalles: err.message });
      }

      res.json(citas);
    });
  });
});

router.get('/:id/citas/todas', (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: 'Debe proporcionar el ID del usuario' });
  }

  // 1. Obtener el ID del peluquero a partir del usuario
  const obtenerPeluqueroQuery = `
    SELECT id FROM peluqueros WHERE usuario_id = ?
  `;

  connection.query(obtenerPeluqueroQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al buscar el peluquero', detalles: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontró un peluquero para este usuario' });
    }

    const peluqueroId = results[0].id;

    // 2. Obtener todas las citas asociadas a ese peluquero
    const obtenerCitasQuery = `
      SELECT 
        c.id,
        DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
        c.hora,
        c.estado,
        c.cliente_id,
        c.peluquero_id,
        u1.nombre AS cliente_nombre,
        u2.nombre AS peluquero_nombre
      FROM citas c
      JOIN Usuarios u1 ON c.cliente_id = u1.id
      JOIN Usuarios u2 ON c.peluquero_id = u2.id
      WHERE c.peluquero_id = ?
      ORDER BY c.fecha DESC, c.hora DESC
    `;

    connection.query(obtenerCitasQuery, [peluqueroId], (err, citas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las citas', detalles: err.message });
      }

      res.json(citas);
    });
  });
});

// Actualizar los datos de un peluquero (imagen opcional)
// Actualizar los datos de un peluquero (imagen y contraseña opcionales)
router.put('/actualizar/:id', (req, res) => {
  const { id } = req.params; // Este es el ID del usuario
  const {
    nombre,
    email,
    telefono,
    sexo,
    imagen, // opcional
    contrasena, // opcional
    especialidad,
    horario_inicio,
    horario_fin
  } = req.body;

  console.log('Datos recibidos:', { nombre, email, telefono, sexo, imagen, contrasena, especialidad, horario_inicio, horario_fin });

  // Primero actualizamos los datos en la tabla Usuarios
  let updateUsuarioQuery = `
    UPDATE Usuarios
    SET nombre = ?, email = ?, telefono = ?, sexo = ?
  `;
  const usuarioParams = [nombre, email, telefono, sexo];

  if (imagen !== undefined && imagen !== null && imagen !== '') {
    updateUsuarioQuery += `, imagen = ?`;
    usuarioParams.push(imagen);
  }

  if (contrasena !== undefined && contrasena !== null && contrasena !== '') {
    updateUsuarioQuery += `, contrasena = ?`;
    usuarioParams.push(contrasena);
  }

  updateUsuarioQuery += ` WHERE id = ?`;
  usuarioParams.push(id);

  connection.query(updateUsuarioQuery, usuarioParams, (err, usuarioResult) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar el usuario', detalles: err.message });
    }

    // Luego buscamos el ID del peluquero correspondiente al usuario
    const getPeluqueroIdQuery = `SELECT id FROM Peluqueros WHERE usuario_id = ?`;
    connection.query(getPeluqueroIdQuery, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error al buscar el peluquero', detalles: err.message });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Peluquero no encontrado' });
      }

      const peluqueroId = results[0].id;

      // Actualizamos los datos del peluquero
      const updatePeluqueroQuery = `
        UPDATE Peluqueros
        SET especialidad = ?, horario_inicio = ?, horario_fin = ?
        WHERE id = ?
      `;

      connection.query(updatePeluqueroQuery, [especialidad, horario_inicio, horario_fin, peluqueroId], (err, peluqueroResult) => {
        if (err) {
          return res.status(500).json({ error: 'Error al actualizar el peluquero', detalles: err.message });
        }

        res.json({ message: 'Peluquero actualizado correctamente' });
      });
    });
  });
});



// Crear un nuevo peluquero
router.post('/anadir', (req, res) => {
  const {
    nombre,
    email,
    telefono,
    sexo,
    imagen, // opcional
    especialidad,
    horario_inicio,
    horario_fin,
    contrasena
  } = req.body;
  

  // Insertar en la tabla Usuarios
  const insertUsuarioQuery = `
    INSERT INTO Usuarios (nombre, email, telefono, sexo, tipo, imagen, contrasena, fecha_registro)
    VALUES (?, ?, ?, ?, 'peluquero', ?, ?, NOW())
  `;

  connection.query(insertUsuarioQuery, [nombre, email, telefono, sexo, imagen, contrasena], (err, usuarioResult) => {
    if (err) {
      return res.status(500).json({ error: 'Error al insertar en Usuarios', detalles: err.message });
    }

    const usuarioId = usuarioResult.insertId;

    // Insertar en la tabla Peluqueros
    const insertPeluqueroQuery = `
      INSERT INTO Peluqueros (usuario_id, especialidad, horario_inicio, horario_fin)
      VALUES (?, ?, ?, ?)
    `;

    connection.query(insertPeluqueroQuery, [usuarioId, especialidad, horario_inicio, horario_fin], (err, peluqueroResult) => {
      if (err) {
        return res.status(500).json({ error: 'Error al insertar en Peluqueros', detalles: err.message });
      }

      res.status(201).json({ message: 'Peluquero creado exitosamente', peluqueroId: peluqueroResult.insertId });
    });
  });
});


module.exports = router;
