const models = require('./models');
const CambioTurno = models.CambioTurno;
const db = require('./config/database');

async function limpiarDatosPrueba() {
  try {
    console.log('🧹 LIMPIANDO DATOS DE PRUEBA');
    console.log('=============================\n');

    // 1. Contar solicitudes antes de limpiar
    console.log('1. Contando solicitudes antes de limpiar...');
    const totalAntes = await CambioTurno.count();
    console.log(`📊 Total de solicitudes antes: ${totalAntes}`);

    // 2. Buscar solicitudes de prueba
    console.log('\n2. Buscando solicitudes de prueba...');
    const solicitudesPrueba = await CambioTurno.findAll({
      where: {
        motivo: {
          [require('sequelize').Op.like]: '%prueba%'
        }
      }
    });

    console.log(`📊 Solicitudes de prueba encontradas: ${solicitudesPrueba.length}`);
    solicitudesPrueba.forEach(sol => {
      console.log(`   ID: ${sol.id}, Motivo: ${sol.motivo}`);
    });

    // 3. Eliminar solicitudes de prueba
    if (solicitudesPrueba.length > 0) {
      console.log('\n3. Eliminando solicitudes de prueba...');
      await CambioTurno.destroy({
        where: {
          motivo: {
            [require('sequelize').Op.like]: '%prueba%'
          }
        }
      });
      console.log('✅ Solicitudes de prueba eliminadas');
    } else {
      console.log('\n3. No hay solicitudes de prueba para eliminar');
    }

    // 4. Contar solicitudes después de limpiar
    console.log('\n4. Contando solicitudes después de limpiar...');
    const totalDespues = await CambioTurno.count();
    console.log(`📊 Total de solicitudes después: ${totalDespues}`);
    console.log(`📊 Solicitudes eliminadas: ${totalAntes - totalDespues}`);

    // 5. Mostrar solicitudes restantes
    console.log('\n5. Mostrando solicitudes restantes...');
    const solicitudesRestantes = await CambioTurno.findAll({
      attributes: ['id', 'empleado_id', 'motivo', 'estado', 'visto_bueno_reemplazo']
    });

    if (solicitudesRestantes.length === 0) {
      console.log('📋 No hay solicitudes restantes');
    } else {
      solicitudesRestantes.forEach(sol => {
        console.log(`   ID: ${sol.id}, Empleado: ${sol.empleado_id}, Estado: ${sol.estado}, Visto Bueno: ${sol.visto_bueno_reemplazo}`);
      });
    }

  } catch (error) {
    console.error('❌ Error al limpiar datos de prueba:', error);
  } finally {
    await db.close();
    console.log('\n🔚 Limpieza completada');
  }
}

limpiarDatosPrueba(); 