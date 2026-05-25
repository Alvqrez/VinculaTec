console.log('=== Verificando configuración del backend ===\n');

// Check JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.log('❌ ERROR: JWT_SECRET no está configurado');
  console.log('   Crea un archivo .env en la carpeta backend con:');
  console.log('   JWT_SECRET=tu_secreto_aqui\n');
} else {
  console.log('✅ JWT_SECRET está configurado');
  console.log('   Longitud:', process.env.JWT_SECRET.length, 'caracteres\n');
}

// Check database
const db = require('./db');
console.log('✅ Database module cargado correctamente\n');

// Summary
console.log('=== Variables de entorno cargadas ===');
console.log('DB_HOST:', process.env.DB_HOST || 'default');
console.log('DB_NAME:', process.env.DB_NAME || 'default');
console.log('PORT:', process.env.PORT || '3001');
