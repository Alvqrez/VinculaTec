const db = require('./db');

async function check() {
  try {
    // Ver usuarios con rol asesor y su registro en tabla asesores
    const [rows] = await db.execute(`
      SELECT u.id, u.nombre, u.correo, u.rol, a.id as asesor_id 
      FROM usuarios u 
      LEFT JOIN asesores a ON u.id = a.usuario_id 
      WHERE u.rol = 'asesor'
    `);
    console.log('=== Usuarios con rol "asesor" ===');
    console.log(JSON.stringify(rows, null, 2));
    
    // Verificar todos los asesores registrados
    const [asesores] = await db.execute('SELECT id, usuario_id, especialidad FROM asesores');
    console.log('\n=== Registros en tabla asesores ===');
    console.log(JSON.stringify(asesores, null, 2));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

check();
