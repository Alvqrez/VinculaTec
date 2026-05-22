/**
 * Script para crear el archivo .env en el backend
 * Ejecutar: node create-env.js
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Configuración de Base de Datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=vinculatec

# Configuración JWT (requerido para autenticación)
JWT_SECRET=mi_secreto_jwt_2026_seguro_para_vinculatec

# Puerto del servidor backend
PORT=3001

# Orígenes CORS permitidos (separados por comas)
CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000

# NOTA: Para usar con ngrok, actualiza CORS_ORIGINS con tu URL ngrok:
# CORS_ORIGINS=https://tu-url-ngrok.ngrok-free.dev,http://localhost:8081,http://localhost:19006
`;

const envPath = path.join(__dirname, '.env');

try {
  // Verificar si ya existe
  if (fs.existsSync(envPath)) {
    console.log('⚠️  El archivo .env ya existe.');
    console.log('📄 Contenido actual:');
    console.log(fs.readFileSync(envPath, 'utf8'));
    console.log('\n✅ No se necesitan cambios.');
    process.exit(0);
  }

  // Crear el archivo
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ Archivo .env creado exitosamente!');
  console.log('\n📄 Contenido:');
  console.log(envContent);
  console.log('\n🚀 Ahora reinicia el backend con: node server.js');
} catch (error) {
  console.error('❌ Error al crear .env:', error.message);
  process.exit(1);
}
