const db = require('./db');

async function testQuery() {
  try {
    console.log('Testing database queries for /api/asesor/proyectos...\n');
    
    // Simular el flujo del endpoint
    const userId = '5'; // ID de Marco
    
    // 1. Verificar si es asesor
    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [userId],
    );
    console.log('1. Asesor lookup:', asesorRows);
    
    if (!asesorRows.length) {
      console.log('ERROR: Usuario no es asesor');
      return;
    }
    
    const asesorId = asesorRows[0].id;
    console.log('2. Asesor ID:', asesorId);
    
    // 3. Verificar tabla proyectos
    const [projects] = await db.execute(
      `SELECT p.id, p.titulo AS title, p.descripcion AS description,
              p.estado AS phase, p.prioridad AS priority,
              e.nombre AS company, e.id AS empresa_id,
              p.progreso, p.tecnologias AS habilidades,
              p.residente_id
       FROM proyectos p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN residentes res ON p.residente_id = res.id
       WHERE p.asesor_id = ?
       ORDER BY p.created_at DESC`,
      [asesorId],
    );
    console.log('3. Projects found:', projects.length);
    console.log('First project:', projects[0]);
    
    // 4. Ver residentes
    if (projects.length > 0) {
      const project = projects[0];
      if (project.residente_id) {
        const [mainRes] = await db.execute(
          `SELECT r.id, u.nombre, u.apellidos
           FROM residentes r
           JOIN usuarios u ON r.usuario_id = u.id
           WHERE r.id = ?`,
          [project.residente_id],
        );
        console.log('4. Residentes:', mainRes);
      }
    }
    
    console.log('\n✅ Todas las consultas funcionaron correctamente');
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err.stack);
  }
  
  process.exit(0);
}

testQuery();
