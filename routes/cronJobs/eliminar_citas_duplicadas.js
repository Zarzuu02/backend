const cron = require('node-cron');
const connection = require('../../database');

// Ejecutar cada hora
cron.schedule('* * * * *', () => {
  console.log('🧹 Buscando y eliminando citas duplicadas...');

  // Paso 1: Obtener grupos duplicados
  const findDuplicatesQuery = `
    SELECT cliente_id, fecha
    FROM citas
    GROUP BY cliente_id, fecha
    HAVING COUNT(*) > 1;
  `;

  connection.query(findDuplicatesQuery, (err, duplicatedGroups) => {
    if (err) {
      console.error('❌ Error al buscar duplicados:', err);
      return;
    }

    if (duplicatedGroups.length === 0) {
      console.log('✅ No hay citas duplicadas.');
      return;
    }

    // Recorremos cada grupo duplicado
    duplicatedGroups.forEach(group => {
      const { cliente_id, fecha } = group;

      // Paso 2: Obtener todas las citas de ese cliente en esa fecha, ordenadas por ID ascendente
      const getCitasQuery = `
        SELECT id
        FROM citas
        WHERE cliente_id = ? AND fecha = ?
        ORDER BY id ASC;
      `;

      connection.query(getCitasQuery, [cliente_id, fecha], (err, citas) => {
        if (err) {
          console.error(`❌ Error al obtener citas del cliente ${cliente_id} en ${fecha}:`, err);
          return;
        }

        // Paso 3: Conservar la primera y eliminar el resto
        const idsAEliminar = citas.slice(1).map(c => c.id);

        if (idsAEliminar.length > 0) {
          const deleteQuery = `DELETE FROM citas WHERE id IN (?);`;
          connection.query(deleteQuery, [idsAEliminar], (err, result) => {
            if (err) {
              console.error(`❌ Error al eliminar duplicados del cliente ${cliente_id}:`, err);
            } else {
              console.log(`🗑️ Eliminadas ${result.affectedRows} citas duplicadas para cliente ${cliente_id} en ${fecha}`);
            }
          });
        }
      });
    });
  });
});
