const express = require('express');
const connection = require('../database');
const { enviarCorreoCita } = require('../routes/correos/creacionCita');
require('dotenv').config();


const router = express.Router();

// Obtener todas las citas con información completa
router.get('/all', (req, res) => {
  const query = `
    SELECT 
      c.id,
      c.cliente_id,
      c.peluquero_id,
      DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
      c.hora,
      c.estado,
      uc.nombre AS cliente_nombre,
      up.nombre AS peluquero_nombre,
      p.especialidad
    FROM citas c
    JOIN clientes cl ON c.cliente_id = cl.id
    JOIN usuarios uc ON cl.usuario_id = uc.id
    JOIN peluqueros p ON c.peluquero_id = p.id
    JOIN usuarios up ON p.usuario_id = up.id;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


// Obtener una cita por ID
router.get('/cita/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT Citas.id AS cita_id, Citas.fecha, Citas.hora, Citas.estado, 
           clientes.id AS cliente_id, U.nombre AS cliente_nombre, U.email AS cliente_email, 
           U.telefono AS cliente_telefono, U.sexo AS cliente_sexo,
           peluqueros.id AS peluquero_id, P.nombre AS peluquero_nombre, 
           P.email AS peluquero_email, P.telefono AS peluquero_telefono, 
           P.sexo AS peluquero_sexo, peluqueros.especialidad, 
           peluqueros.horario_inicio, peluqueros.horario_fin
    FROM Citas
    JOIN clientes ON Citas.cliente_id = clientes.id
    JOIN usuarios U ON clientes.usuario_id = U.id
    JOIN peluqueros ON Citas.peluquero_id = peluqueros.id
    JOIN usuarios P ON peluqueros.usuario_id = P.id
    WHERE Citas.id = ?;
  `;

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.json(results[0]);
  });
});

// Crear una nueva cita
router.post('/crear', (req, res) => {
  const { usuario_id, peluquero_id, fecha, hora, estado } = req.body;

  console.log("Fecha recibida:", fecha);

  const queryGetCliente = `
    SELECT id FROM clientes WHERE usuario_id = ?;
  `;

  connection.query(queryGetCliente, [usuario_id], (err, resultsCliente) => {
    if (err) return res.status(500).json({ error: err.message });
    if (resultsCliente.length === 0) return res.status(404).json({ error: 'No se encontró cliente para este usuario' });

    const cliente_id = resultsCliente[0].id;

    const queryCheck = `
      SELECT * FROM citas 
      WHERE fecha = ? AND hora = ? 
      AND peluquero_id = ?;
    `;

    connection.query(queryCheck, [fecha, hora, peluquero_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) return res.status(400).json({ error: 'Este peluquero ya tiene una cita en ese horario.' });

      const queryCheckCliente = `
        SELECT * FROM citas
        WHERE fecha = ? AND hora = ?
        AND cliente_id = ?;
      `;

      connection.query(queryCheckCliente, [fecha, hora, cliente_id], (err, resultsCliente) => {
        if (err) return res.status(500).json({ error: err.message });
        if (resultsCliente.length > 0) return res.status(400).json({ error: 'Ya tienes una cita en ese horario.' });

        const queryInsert = `
          INSERT INTO citas (cliente_id, peluquero_id, fecha, hora, estado)
          VALUES (?, ?, ?, ?, ?);
        `;

        connection.query(queryInsert, [cliente_id, peluquero_id, fecha, hora, estado], (err, results) => {
          if (err) return res.status(500).json({ error: err.message });

          const queryInfo = `
            SELECT 
              uc.email AS cliente_email,
              uc.nombre AS cliente_nombre,
              up.nombre AS peluquero_nombre
            FROM clientes cl
            JOIN usuarios uc ON cl.usuario_id = uc.id
            JOIN peluqueros p ON p.id = ?
            JOIN usuarios up ON p.usuario_id = up.id
            WHERE cl.id = ?;
          `;

          connection.query(queryInfo, [peluquero_id, cliente_id], async (err, infoResults) => {
            if (err) {
              console.error('Error al obtener info para correo:', err);
            } else if (infoResults.length > 0) {
              const cliente = infoResults[0];
              try {
                const fechaFormateada = fecha.split('-').reverse().join('/'); // Ej: 08/05/2025

                await enviarCorreoCita({
                  email: cliente.cliente_email,
                  nombre: cliente.cliente_nombre,
                  fecha: fechaFormateada,
                  hora,
                  peluquero: cliente.peluquero_nombre
                });
              } catch (correoErr) {
                console.error('Error al enviar el correo:', correoErr);
              }
            }
          });

          res.status(201).json({ message: 'Cita creada exitosamente', cita_id: results.insertId });
        });
      });
    });
  });
});








// Eliminar una cita por ID
router.delete('/eliminar/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM Citas WHERE id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) return res.status(404).json({ message: 'Cita no encontrada' });

    res.json({ message: 'Cita eliminada exitosamente' });
  });
});



router.get('/peluquero/:peluquero_id/citas', (req, res) => {
  const { peluquero_id } = req.params; // Obtenemos el id del peluquero de los parámetros de la URL
  const { fecha } = req.query; // Obtenemos la fecha de la query string

  // Verificar que se haya proporcionado la fecha
  if (!fecha) {
    return res.status(400).json({ message: 'Debe proporcionar una fecha' });
  }

  // Consulta SQL para obtener las citas
  const query = `
    SELECT 
      c.id AS cita_id, 
      DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
      c.hora, 
      c.estado, 
      us.nombre AS cliente_nombre, 
      us.email AS cliente_email, 
      us.telefono AS cliente_telefono
    FROM citas c
    JOIN clientes cl ON c.cliente_id = cl.id
    JOIN usuarios us ON cl.usuario_id = us.id
    WHERE c.peluquero_id = ? AND c.fecha = ?;
  `;

  // Ejecutar la consulta con los parámetros proporcionados
  connection.query(query, [peluquero_id, fecha], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    // Si no hay citas para ese peluquero y fecha
    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay citas para este peluquero en esa fecha' });
    }

    // Devolver las citas encontradas
    res.json(results);
  });
});


router.get('/citas/hoy', (req, res) => {
  const query = `
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
    JOIN usuarios u1 ON c.cliente_id = u1.id
    JOIN usuarios u2 ON c.peluquero_id = u2.id
    WHERE c.fecha = CURDATE() 
    Order BY c.fecha ASC AND c.hora ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener las citas de hoy', detalles: err.message });
    }

    res.json(results);
  });
});



router.get('/todas', (req, res) => {
  const query = `
    SELECT 
      c.id,
      DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
      c.hora,
      c.estado,
      c.cliente_id,
      c.peluquero_id,
      u_cliente.nombre AS cliente_nombre,
      u_peluquero.nombre AS peluquero_nombre
    FROM citas c
    JOIN clientes cl ON c.cliente_id = cl.id
    JOIN usuarios u_cliente ON cl.usuario_id = u_cliente.id
    JOIN peluqueros p ON c.peluquero_id = p.id
    JOIN usuarios u_peluquero ON p.usuario_id = u_peluquero.id
    WHERE c.estado != 'pendiente'
    ORDER BY c.fecha ASC, c.hora ASC;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener todas las citas', detalles: err.message });
    }

    // No conviertas fecha con new Date(); eso rompe la zona horaria
    res.json(results);
  });
});




router.get('/todas/pendientes', (req, res) => {
  const query = `
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
    JOIN usuarios u1 ON c.cliente_id = u1.id
    JOIN usuarios u2 ON c.peluquero_id = u2.id
    WHERE c.estado = 'pendiente'
    ORDER BY c.fecha ASC, c.hora ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al obtener todas las citas pendientes', detalles: err.message });
    }

    res.json(results);
  });
});




router.put('/actualizar/:id', (req, res) => {
  const { id } = req.params; // ID de la cita a actualizar
  const { fecha, hora, estado } = req.body; // Nuevos datos para la cita

  // Verificar que se haya proporcionado una fecha y hora
  if (!fecha || !hora) {
    return res.status(400).json({ message: 'Debe proporcionar una fecha y hora' });
  }

  const query = `
    UPDATE citas 
    SET fecha = ?, hora = ?, estado = ? 
    WHERE id = ?;
  `;

  connection.query(query, [fecha, hora, estado, id], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    res.json({ message: 'Cita actualizada exitosamente' });
  });

});


router.get('/hoy/all', (req, res) => {
  
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
      JOIN usuarios u1 ON c.cliente_id = u1.id
      JOIN usuarios u2 ON c.peluquero_id = u2.id
      WHERE c.fecha = CURDATE()
      ORDER BY c.hora ASC
    `;

    connection.query(obtenerCitasQuery, (err, citas) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener las citas de hoy', detalles: err.message });
      }

      res.json(citas);
    });
});



module.exports = router;

