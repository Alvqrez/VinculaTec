/**
 * Script para actualizar CORS_ORIGINS en .env
 * Ejecutar: node update-cors.js
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

// Leer contenido actual
let content = fs.readFileSync(envPath, 'utf8');

// Nueva línea CORS con la IP local
const newCors = 'CORS_ORIGINS=http://192.168.100.10:8081,http://192.168.100.10:3001,http://localhost:8081,http://localhost:19006,http://localhost:3000';

// Reemplazar línea existente o agregar al final
if (content.includes('CORS_ORIGINS=')) {
  content = content.replace(/CORS_ORIGINS=.*/g, newCors);
  console.log('✅ Línea CORS_ORIGINS actualizada');
} else {
  content += '\n' + newCors;
  console.log('✅ Línea CORS_ORIGINS agregada');
}

// Guardar cambios
fs.writeFileSync(envPath, content, 'utf8');

console.log('\n📄 Nuevo contenido de CORS_ORIGINS:');
console.log(newCors);
console.log('\n🚀 Reinicia el backend con: node server.js');
