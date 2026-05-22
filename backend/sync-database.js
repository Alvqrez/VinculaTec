/**
 * Script para sincronizar la base de datos con el schema actual
 * Ejecutar: node sync-database.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const ALTER_STATEMENTS = [
  // Agregar columna nombre_archivo a reportes
  `ALTER TABLE reportes ADD COLUMN IF NOT EXISTS nombre_archivo VARCHAR(255) AFTER archivo_url`,
  
  // Agregar columna periodo a proyectos
  `ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS periodo VARCHAR(50) AFTER asesor_id`,
  `ALTER TABLE proyectos ADD INDEX IF NOT EXISTS idx_periodo (periodo)`,
  
  // Crear tabla fotos_perfil si no existe
  `CREATE TABLE IF NOT EXISTS fotos_perfil (
    usuario_id VARCHAR(50) PRIMARY KEY,
    foto_base64 MEDIUMTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function syncDatabase() {
  console.log('🔧 Sincronizando base de datos...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vinculatec',
    multipleStatements: true,
  });
  
  for (const sql of ALTER_STATEMENTS) {
    try {
      await connection.execute(sql);
      console.log('✅', sql.substring(0, 60) + '...');
    } catch (error) {
      if (error.message.includes('Duplicate column') || error.message.includes('already exists')) {
        console.log('ℹ️  Ya existe:', sql.substring(0, 50) + '...');
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
  
  console.log('\n✅ Sincronización completada!');
  console.log('🚀 Reinicia el backend: node server.js');
  
  await connection.end();
}

syncDatabase().catch(console.error);
