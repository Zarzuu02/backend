const cron = require('node-cron');
const connection = require('../../database'); 

// Cron job que se ejecuta cada minuto para actualizar citas pasadas a "realizada"
cron.schedule('* * * * *', () => {
    console.log('⏳ Verificando citas para marcar como realizadas...');
  
    // Consulta para encontrar citas confirmadas cuya fecha y hora ya pasaron
    const query = `
      SELECT * FROM citas
      WHERE estado = 'confirmada'
        AND CONCAT(fecha, ' ', hora) <= NOW();
    `;
  
    connection.query(query, (err, results) => {
      if (err) {
        console.error('❌ Error al obtener citas pasadas:', err);
        return;
      }
  
      if (results.length > 0) {
        const ids = results.map(c => c.id);
  
        const updateQuery = `
          UPDATE citas
          SET estado = 'realizada'
          WHERE id IN (?);
        `;
  
        connection.query(updateQuery, [ids], (err, updateResults) => {
          if (err) {
            console.error('❌ Error al actualizar citas a realizada:', err);
            return;
          }
  
          console.log(`✅ Citas marcadas como realizadas: ${updateResults.affectedRows}`);
        });
      } else {
        console.log('🔍 No hay citas pasadas para marcar como realizadas.');
      }
    });
  });
  