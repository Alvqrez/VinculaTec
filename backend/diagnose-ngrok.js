/**
 * Script de diagnóstico para ngrok
 * Ejecutar: node diagnose-ngrok.js
 */

const { exec, spawn } = require('child_process');
const http = require('http');

console.log('🔍 Diagnóstico de ngrok\n');

// 1. Verificar si ngrok está instalado
console.log('1️⃣  Verificando instalación de ngrok...');
exec('ngrok version', (error, stdout) => {
  if (error) {
    console.log('   ❌ ngrok NO está instalado o no está en el PATH');
    console.log('   💡 Descarga desde: https://ngrok.com/download');
    return;
  }
  console.log(`   ✅ ngrok instalado: ${stdout.trim()}`);
  
  // 2. Verificar backend
  console.log('\n2️⃣  Verificando backend en localhost:3001...');
  http.get('http://localhost:3001/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.ok) {
          console.log('   ✅ Backend está corriendo:', response.mensaje);
          
          // 3. Intentar iniciar ngrok
          console.log('\n3️⃣  Intentando iniciar ngrok...');
          console.log('   ⏳ Esto tomará unos segundos...\n');
          
          const ngrok = spawn('ngrok', ['http', '3001'], { 
            stdio: 'pipe',
            shell: true
          });
          
          let output = '';
          ngrok.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          ngrok.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          // Esperar 5 segundos para ver la salida
          setTimeout(() => {
            console.log('\n📋 Salida de ngrok:');
            console.log('='.repeat(50));
            console.log(output);
            console.log('='.repeat(50));
            
            // Buscar la URL en la salida
            const urlMatch = output.match(/(https:\/\/[a-z0-9-]+\.ngrok-free\.dev)/);
            if (urlMatch) {
              console.log('\n✅ ¡ngrok está funcionando!');
              console.log(`🌐 URL pública: ${urlMatch[1]}`);
              console.log('\n💡 Para usar esta URL:');
              console.log(`   echo REACT_APP_API_URL=${urlMatch[1]}/api > ..\\.env.local`);
              console.log('\n⚠️  No cierres esta ventana. ngrok sigue corriendo.');
              console.log('   Presiona Ctrl+C aquí cuando quieras detenerlo.');
            } else if (output.includes('reconnecting') || output.includes('failed')) {
              console.log('\n❌ ngrok está fallando al conectar.');
              console.log('\n🔧 Soluciones a intentar:');
              console.log('   1. Verificar token: ngrok config add-authtoken TU_TOKEN');
              console.log('   2. Verificar conexión a internet: ping ngrok.com');
              console.log('   3. Intentar con región diferente: ngrok http 3001 --region us');
              console.log('   4. Reiniciar tu computadora');
              ngrok.kill();
            } else {
              console.log('\n⏳ ngrok puede estar iniciándose...');
              console.log('   Espera unos segundos más o revisa http://127.0.0.1:4040');
            }
          }, 6000);
          
        } else {
          console.log('   ❌ Backend respondió pero con error');
        }
      } catch (e) {
        console.log('   ❌ Backend no responde correctamente');
        console.log('   💡 Inicia el backend primero: node server.js');
      }
    });
  }).on('error', () => {
    console.log('   ❌ Backend NO está corriendo en localhost:3001');
    console.log('   💡 Inicia el backend primero:');
    console.log('      cd backend');
    console.log('      node server.js');
  });
});
