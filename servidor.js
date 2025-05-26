const express = require('express');
const cors = require('cors');
const connection = require('./database');  // Importamos la conexión a la base de datos

const app = express();

// Middleware para habilitar CORS y permitir JSON
app.use(cors());
app.use(express.json());



// ----------------------- USUARIOS -------------------------- //

// -- GET -- 

// Endpoint: Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  connection.query('SELECT * FROM Usuarios', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


// Endpoint: Obtener un usuario por su ID
app.get('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM Usuarios WHERE id = ?';

  connection.query(query, [id], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const usuario = results[0];
      
      // Verificamos el tipo del usuario y devolver la información correspondiente
      if (usuario.tipo === 'peluquero') {
          const peluqueroQuery = 'SELECT * FROM Peluqueros WHERE usuario_id = ?';
          connection.query(peluqueroQuery, [usuario.id], (err, peluqueroResults) => {
              if (err) {
                  return res.status(500).json({ error: err.message });
              }
              return res.json({
                  ...usuario,
                  tipo: 'peluquero',
                  especialidad: peluqueroResults[0].especialidad,
                  horario_inicio: peluqueroResults[0].horario_inicio,
                  horario_fin: peluqueroResults[0].horario_fin,
              });
          });
      } else {
          return res.json({ ...usuario, tipo: usuario.tipo });
      }
  });
});




// Endpoint: Obtener un usuario por email y contraseña
app.post('/usuarios/login', (req, res) => {
  const { email, contrasena } = req.body;
  const query = 'SELECT * FROM Usuarios WHERE email = ? AND contrasena = ?';

  connection.query(query, [email, contrasena], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      if (results.length === 0) {
          return res.status(404).json({ message: 'Usuario no encontrado o credenciales incorrectas' });
      }

      const usuario = results[0];

      // Verificamos el tipo del usuario
      const tipo = usuario.tipo;

      // Si es cliente
      if (tipo === 'cliente') {
          return res.json({ ...usuario, tipo: 'cliente' });
      }

      // Si es peluquero
      if (tipo === 'peluquero') {
        const peluqueroQuery = 'SELECT * FROM Peluqueros WHERE usuario_id = ?';
        connection.query(peluqueroQuery, [usuario.id], (err, peluqueroResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
          }
      
          if (peluqueroResults.length === 0) {
            return res.status(404).json({ error: 'Peluquero no encontrado' });
          }
      
          const peluquero = peluqueroResults[0];
      
          return res.json({
            ...usuario,
            tipo: 'peluquero',
            especialidad: peluquero.especialidad,
            horario_inicio: peluquero.horario_inicio,
            horario_fin: peluquero.horario_fin,
          });
        });
      
        return; // ✅ Evita que el código siga y se envíe otra respuesta
      }
      
  
      // Si es admin
      if (tipo === 'admin') {
          return res.json({ ...usuario, tipo: 'admin' });
      }

      // Si no se encuentra un tipo válido
      return res.status(500).json({ message: 'Tipo de usuario no reconocido' });
  });
});



//-- POST -- 

// Endpoint: Crear un nuevo usuario
app.post('/usuarios', (req, res) => {
  const { nombre, email, contrasena, telefono, sexo, tipo } = req.body;
  const query = 'INSERT INTO Usuarios (nombre, email, contrasena, telefono, sexo, tipo) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(query, [nombre, email, contrasena, telefono, sexo, tipo], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Usuario creado exitosamente', id: results.insertId });
  });
});



//-- PUT -- (Actualizar un usuario existente)

// Actualizar un usuario por ID
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { nombre, email, contrasena, telefono, sexo } = req.body;
    const query = 'UPDATE Usuarios SET nombre = ?, email = ?, contrasena = ?, telefono = ?, sexo = ? WHERE id = ?';
  
    connection.query(query, [nombre, email, contrasena, telefono, sexo, id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json({ message: 'Usuario actualizado exitosamente' });
    });
  });
  

//-- DELETE -- (Eliminar un usuario existente)

// Eliminar un usuario por ID
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM Usuarios WHERE id = ?';
  
    connection.query(query, [id], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json({ message: 'Usuario eliminado exitosamente' });
    });
  });


// Endpoint: Obtener un cliente por su ID
// Endpoint para obtener un cliente con los datos del usuario
app.get('/clientes/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      Clientes.id AS cliente_id,
      Usuarios.id AS usuario_id,
      Usuarios.nombre,
      Usuarios.email,
      Usuarios.telefono,
      Usuarios.sexo,
      Usuarios.fecha_registro,
      Usuarios.imagen
    FROM Clientes
    JOIN Usuarios ON Clientes.usuario_id = Usuarios.id
    WHERE Clientes.id = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const cliente = results[0];
    const clienteResponse = {
      cliente_id: cliente.cliente_id,
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      sexo: cliente.sexo,
      fecha_registro: cliente.fecha_registro,
      usuario: {
        id: cliente.usuario_id,
        nombre: cliente.nombre,
        email: cliente.email,
        telefono: cliente.telefono,
        sexo: cliente.sexo,
        fecha_registro: cliente.fecha_registro,
        imagen: cliente.imagen,
      },
    };

    res.json(clienteResponse);
  });
});


// Endpoint: Crear un nuevo cliente
app.post('/clientes', (req, res) => {
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


// Endpoint: Obtener un peluquero por su ID
// Endpoint para obtener un peluquero con los datos del usuario
app.get('/peluqueros/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      Peluqueros.id AS peluquero_id,
      Usuarios.id AS usuario_id,
      Usuarios.nombre,
      Usuarios.email,
      Usuarios.telefono,
      Usuarios.sexo,
      Usuarios.fecha_registro,
      Usuarios.imagen,
      Peluqueros.especialidad,
      Peluqueros.horario_inicio,
      Peluqueros.horario_fin
    FROM Peluqueros
    JOIN Usuarios ON Peluqueros.usuario_id = Usuarios.id
    WHERE Peluqueros.id = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Peluquero no encontrado' });
    }

    const peluquero = results[0];
    const peluqueroResponse = {
      // peluquero_id: peluquero.peluquero_id,
      // nombre: peluquero.nombre,
      // email: peluquero.email,
      // telefono: peluquero.telefono,
      // sexo: peluquero.sexo,
      // fecha_registro: peluquero.fecha_registro,
      especialidad: peluquero.especialidad,
      horario_inicio: peluquero.horario_inicio,
      horario_fin: peluquero.horario_fin,
      usuario: {
        id: peluquero.usuario_id,
        nombre: peluquero.nombre,
        email: peluquero.email,
        telefono: peluquero.telefono,
        sexo: peluquero.sexo,
        fecha_registro: peluquero.fecha_registro,
        imagen: peluquero.imagen,
      },
    };

    res.json(peluqueroResponse);
  });
});


// Endpoint: Obtener todas las citas
app.get('/citas', (req, res) => {
  const query = `
    SELECT Citas.id AS cita_id, Citas.fecha, Citas.hora, Citas.estado, 
           Clientes.id AS cliente_id, U.nombre AS cliente_nombre, U.email AS cliente_email, 
           U.telefono AS cliente_telefono, U.sexo AS cliente_sexo,
           Peluqueros.id AS peluquero_id, P.nombre AS peluquero_nombre, 
           P.email AS peluquero_email, P.telefono AS peluquero_telefono, 
           P.sexo AS peluquero_sexo, Peluqueros.especialidad, 
           Peluqueros.horario_inicio, Peluqueros.horario_fin
    FROM Citas
    JOIN Clientes ON Citas.cliente_id = Clientes.id
    JOIN Usuarios U ON Clientes.usuario_id = U.id
    JOIN Peluqueros ON Citas.peluquero_id = Peluqueros.id
    JOIN Usuarios P ON Peluqueros.usuario_id = P.id;
  `;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


// Endpoint: Obtener una cita por su ID
app.get('/citas/cita/:id', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT Citas.id AS cita_id, Citas.fecha, Citas.hora, Citas.estado, 
           Clientes.id AS cliente_id, U.nombre AS cliente_nombre, U.email AS cliente_email, 
           U.telefono AS cliente_telefono, U.sexo AS cliente_sexo,
           Peluqueros.id AS peluquero_id, P.nombre AS peluquero_nombre, 
           P.email AS peluquero_email, P.telefono AS peluquero_telefono, 
           P.sexo AS peluquero_sexo, Peluqueros.especialidad, 
           Peluqueros.horario_inicio, Peluqueros.horario_fin
    FROM Citas
    JOIN Clientes ON Citas.cliente_id = Clientes.id
    JOIN Usuarios U ON Clientes.usuario_id = U.id
    JOIN Peluqueros ON Citas.peluquero_id = Peluqueros.id
    JOIN Usuarios P ON Peluqueros.usuario_id = P.id
    WHERE Citas.id = ?;
  `;

  connection.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    res.json(results[0]);
  });
});

// Endpoint: Crear una nueva cita
app.post('/citas/crear', (req, res) => {
  const { cliente_id, peluquero_id, fecha, hora, estado } = req.body;

  const query = `
    INSERT INTO Citas (cliente_id, peluquero_id, fecha, hora, estado) 
    VALUES (?, ?, ?, ?, ?);
  `;

  connection.query(query, [cliente_id, peluquero_id, fecha, hora, estado], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Cita creada exitosamente', id: results.insertId });
  });
});

// Endpoint: Eliminar una cita por ID
app.delete('/citas/eliminar/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM Citas WHERE id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Cita no encontrada' });
    }
    res.json({ message: 'Cita eliminada exitosamente' });
  });
});

// Obtener citas de un cliente específico
app.get('/clientes/:cliente_id/citas', (req, res) => {
  const { cliente_id } = req.params;

  const query = `
    SELECT Citas.id AS cita_id, Citas.fecha, Citas.hora, Citas.estado, 
           Peluqueros.id AS peluquero_id, P.nombre AS peluquero_nombre
    FROM Citas
    JOIN Peluqueros ON Citas.peluquero_id = Peluqueros.id
    JOIN Usuarios P ON Peluqueros.usuario_id = P.id
    WHERE Citas.cliente_id = ?;
  `;

  connection.query(query, [cliente_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Obtener citas de un peluquero específico
app.get('/peluqueros/:peluquero_id/citas', (req, res) => {
  const { peluquero_id } = req.params;

  const query = `
    SELECT Citas.id AS cita_id, Citas.fecha, Citas.hora, Citas.estado, 
           Clientes.id AS cliente_id, U.nombre AS cliente_nombre
    FROM Citas
    JOIN Clientes ON Citas.cliente_id = Clientes.id
    JOIN Usuarios U ON Clientes.usuario_id = U.id
    WHERE Citas.peluquero_id = ?;
  `;

  connection.query(query, [peluquero_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

app.post('/register', (req, res) => {
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


// Endpoint para obtener peluqueros disponibles
app.get('/peluqueros/disponibles', (req, res) => {
  const { fecha, hora } = req.query;  // Obtenemos la fecha y la hora del query string
  
  // Verificamos si los parámetros fueron proporcionados
  if (!fecha || !hora) {
    return res.status(400).json({ message: 'Debe proporcionar la fecha y la hora' });
  }

  // Consulta SQL para obtener los peluqueros disponibles
  const query = `
    SELECT p.id, u.nombre, p.especialidad
    FROM peluqueros p
    JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.id NOT IN (
      SELECT c.peluquero_id
      FROM citas c
      WHERE c.fecha = ? AND c.hora = ? AND c.estado != 'cancelada'
    );
  `;

  // Ejecutamos la consulta con los parámetros proporcionados
  db.query(query, [fecha, hora], (err, results) => {
    if (err) {
      console.error('Error en la consulta:', err);
      return res.status(500).json({ message: 'Error en la base de datos' });
    }

    // Si no hay peluqueros disponibles
    if (results.length === 0) {
      return res.status(404).json({ message: 'No hay peluqueros disponibles para esa fecha y hora' });
    }

    // Devolvemos los peluqueros disponibles
    res.json(results);
  });
});


// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
