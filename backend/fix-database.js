const db = require('./db');

async function fixDatabase() {
  try {
    console.log('=== Verificando y arreglando esquema de base de datos ===\n');
    
    // Verificar si la columna solicitud_avance existe
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM proyectos LIKE 'solicitud_avance'
    `);
    
    if (columns.length === 0) {
      console.log('❌ Columna "solicitud_avance" no existe. Agregándola...');
      await db.execute(`
        ALTER TABLE proyectos 
        ADD COLUMN solicitud_avance TINYINT(1) NOT NULL DEFAULT 0
      `);
      console.log('✅ Columna "solicitud_avance" agregada correctamente');
    } else {
      console.log('✅ Columna "solicitud_avance" ya existe');
    }
    
    // Verificar otras columnas que podrían faltar
    const [createdAt] = await db.execute(`
      SHOW COLUMNS FROM proyectos LIKE 'created_at'
    `);
    
    if (createdAt.length === 0) {
      console.log('❌ Columna "created_at" no existe. Agregándola...');
      await db.execute(`
        ALTER TABLE proyectos 
        ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
      console.log('✅ Columna "created_at" agregada');
    }
    
    console.log('\n✅ Base de datos lista');
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
  
  process.exit(0);
}

fixDatabase();
