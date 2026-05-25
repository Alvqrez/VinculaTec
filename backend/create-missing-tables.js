const db = require('./db');

async function createMissingTables() {
  try {
    console.log('=== Creando tablas faltantes ===\n');

    // 1. Tabla proyecto_asesores (sin foreign keys para evitar errores de constraint)
    console.log('Creando tabla proyecto_asesores...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS proyecto_asesores (
        id VARCHAR(50) PRIMARY KEY,
        proyecto_id VARCHAR(50) NOT NULL,
        asesor_id VARCHAR(50) NOT NULL,
        rol VARCHAR(50) DEFAULT 'principal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_proyecto_asesor (proyecto_id, asesor_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla proyecto_asesores creada\n');

    // 2. Tabla notificaciones_activas (sin foreign keys)
    console.log('Creando tabla notificaciones_activas...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notificaciones_activas (
        id VARCHAR(50) PRIMARY KEY,
        usuario_id VARCHAR(50) NOT NULL,
        tipo_notificacion VARCHAR(100),
        titulo VARCHAR(255),
        mensaje TEXT,
        is_read TINYINT(1) DEFAULT 0,
        icon VARCHAR(50),
        icon_color VARCHAR(20),
        icon_bg VARCHAR(20),
        proyecto_id VARCHAR(50),
        fase VARCHAR(50),
        action_screen VARCHAR(100),
        action_label VARCHAR(100),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario (usuario_id),
        INDEX idx_proyecto (proyecto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla notificaciones_activas creada\n');

    // 3. Insertar datos de prueba para proyecto_asesores si hay proyectos existentes
    console.log('Verificando proyectos existentes...');
    const [proyectos] = await db.execute('SELECT id, asesor_id FROM proyectos WHERE asesor_id IS NOT NULL');
    
    if (proyectos.length > 0) {
      console.log(`Encontrados ${proyectos.length} proyectos. Asignando asesores...`);
      
      for (const p of proyectos) {
        try {
          const id = `PA_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await db.execute(
            `INSERT IGNORE INTO proyecto_asesores (id, proyecto_id, asesor_id, rol) 
             VALUES (?, ?, ?, 'principal')`,
            [id, p.id, p.asesor_id]
          );
        } catch (e) {
          // Ignorar duplicados
        }
      }
      console.log('✅ Proyectos asignados a asesores\n');
    }

    console.log('=== ✅ Todas las tablas creadas correctamente ===');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    console.error(err.stack);
  }

  process.exit(0);
}

createMissingTables();
