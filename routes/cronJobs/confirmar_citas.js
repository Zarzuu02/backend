const cron = require('node-cron');
const connection = require('../../database');
const { sendConfirmationEmail } = require('../../routes/correos/confirmacionCita'); // Asegúrate de que la ruta sea correcta

// Ejecutar cada minuto (ajusta si prefieres otra frecuencia)
cron.schedule('* * * * *', () => {
  console.log('🔄 Verificando citas para confirmar...');

  const query = `
    SELECT 
      c.id, c.fecha, c.hora, 
      u.email AS cliente_email, 
      u.nombre AS cliente_nombre 
    FROM citas c
    JOIN clientes cl ON c.cliente_id = cl.id
    JOIN usuarios u ON cl.usuario_id = u.id
    WHERE c.estado = 'pendiente' 
      AND c.fecha = DATE_ADD(CURDATE(), INTERVAL 1 DAY);
  `;

  connection.query(query, (err, citas) => {
    if (err) {
      console.error('❌ Error al obtener citas:', err);
      return;
    }

    if (citas.length === 0) {
      console.log('✅ No hay citas pendientes para confirmar.');
      return;
    }

    const citasIds = citas.map(cita => cita.id);

    const updateQuery = `
      UPDATE citas 
      SET estado = 'confirmada' 
      WHERE id IN (?);
    `;

    connection.query(updateQuery, [citasIds], async (err, updateResults) => {
      if (err) {
        console.error('❌ Error al actualizar las citas:', err);
        return;
      }

      console.log(`✅ Citas confirmadas: ${updateResults.affectedRows}`);

      // Enviar correos de confirmación
      for (const cita of citas) {
        try {
          await sendConfirmationEmail(
            cita.cliente_email,
            cita.cliente_nombre,
            cita.fecha,
            cita.hora
          );
          console.log(`📨 Correo enviado a ${cita.cliente_email}`);
        } catch (emailError) {
          console.error(`❌ Error al enviar correo a ${cita.cliente_email}:`, emailError);
        }
      }
    });
  });
});
