const express = require('express');
const connection = require('../database');

const router = express.Router();

const upload = require('./upload');



router.get('/:id', (req, res) => {
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

// Obtener un usuario por email y contraseña
router.post('/login', (req, res) => {
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


// Crear un nuevo usuario
router.post('/insertar', (req, res) => {
  const { nombre, email, contrasena, telefono, sexo, tipo } = req.body;
  const query = 'INSERT INTO Usuarios (nombre, email, contrasena, telefono, sexo, tipo) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(query, [nombre, email, contrasena, telefono, sexo, tipo], (err, results) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Usuario creado exitosamente', id: results.insertId });
  });
});

// Actualizar un usuario por ID


// Ruta de actualización de usuario
router.put('/actualizar/:id', upload.single('imagen'), (req, res) => {
  const { nombre, email, contrasena, telefono, sexo, fechaRegistro } = req.body;
  const id = req.params.id;

  let query;
  let params;

  // Si hay nueva imagen, la incluimos en la actualización
  if (req.file) {
    const imagen = `/uploads/${req.file.filename}`;
    query = 'UPDATE Usuarios SET nombre = ?, email = ?, contrasena = ?, telefono = ?, sexo = ?, imagen = ? WHERE id = ?';
    params = [nombre, email, contrasena, telefono, sexo, imagen, id];
  } else {
    // Si no hay imagen, no la actualizamos
    query = 'UPDATE Usuarios SET nombre = ?, email = ?, contrasena = ?, telefono = ?, sexo = ? WHERE id = ?';
    params = [nombre, email, contrasena, telefono, sexo, id];
  }

  console.log('Datos recibidos:', { nombre, email, contrasena, telefono, sexo, fechaRegistro });

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Error al actualizar el usuario:', err);
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario actualizado exitosamente' });
  });
});



router.put('/actualizar/imagen/:id', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se proporcionó ninguna imagen.' });
  }

  const imagen = `/uploads/${req.file.filename}`;

  console.log('Datos recibidos:', { imagen });

  const query = 'UPDATE Usuarios SET imagen = ? WHERE id = ?';

  connection.query(query, [imagen, req.params.id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el usuario:', err);
      return res.status(500).json({ error: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado exitosamente', imagen });
  });
});


const path = require('path');
const fs = require('fs');

// Obtener imagen de usuario por ID
router.get('/imagen/:id', (req, res) => {
  const { id } = req.params;

  const query = 'SELECT imagen FROM Usuarios WHERE id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error al consultar la base de datos' });
    }

    if (results.length === 0 || !results[0].imagen) {
      return res.status(404).json({ error: 'Imagen no encontrada para este usuario' });
    }

    const rutaImagen = path.join(__dirname, '..', results[0].imagen);

    // Verifica que el archivo exista antes de enviarlo
    fs.access(rutaImagen, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Archivo de imagen no encontrado en el servidor' });
      }

      res.sendFile(rutaImagen);
    });
  });
});



// Eliminar un usuario por ID
router.delete('/eliminar/:id', (req, res) => {
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

module.exports = router;
