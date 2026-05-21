/**
 * VinculaTec — seed-clean.js
 * Seed limpio para pruebas desde cero
 * Solo crea jefes de vinculación y empresas
 * Los asesores y residentes se crean manualmente a través del sistema
 *
 * Uso:
 *   cd backend && node seed-clean.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "vinculatec",
    multipleStatements: true,
    charset: "utf8mb4",
  });
}

const PASSWORD_PLAIN = "vinculatec123";

// Solo jefes de vinculación para crear asesores y residentes manualmente
const USUARIOS = [
  {
    id: "JEFE-1",
    nombre: "Director",
    apellidos: "Vinculación",
    correo: "director@itm.edu.mx",
    rol: "jefe",
  },
  {
    id: "JEFE-2",
    nombre: "Coordinador",
    apellidos: "Residencias",
    correo: "coordinador@itm.edu.mx",
    rol: "jefe",
  },
];

// Empresas disponibles para asignar a proyectos
const EMPRESAS = [
  {
    id: "EMP-1",
    nombre: "Telmex S.A. de C.V.",
    sector: "Telecomunicaciones",
    ciudad: "Monterrey",
    estado: "Activa",
    convenio_vencimiento: "2027-12-31",
    contacto_nombre: "Ing. Carlos Ruiz",
    contacto_email: "carlos.ruiz@telmex.com",
    contacto_telefono: "8181234567",
  },
  {
    id: "EMP-2",
    nombre: "Softtek",
    sector: "Tecnología",
    ciudad: "Monterrey",
    estado: "Activa",
    convenio_vencimiento: "2027-06-30",
    contacto_nombre: "Lic. María González",
    contacto_email: "maria.gonzalez@softtek.com",
    contacto_telefono: "8187654321",
  },
  {
    id: "EMP-3",
    nombre: "Grupo FEMSA",
    sector: "Manufactura",
    ciudad: "Monterrey",
    estado: "Activa",
    convenio_vencimiento: "2028-01-15",
    contacto_nombre: "Dr. Roberto Martínez",
    contacto_email: "roberto.martinez@femsa.com",
    contacto_telefono: "8189876543",
  },
];

async function main() {
  const db = await getConnection();
  console.log("✅  Conectado a MySQL.");

  // Limpiar tablas
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");
  await db.execute("DELETE FROM notificaciones");
  await db.execute("DELETE FROM citas");
  await db.execute("DELETE FROM fuentes_informacion");
  await db.execute("DELETE FROM reportes");
  await db.execute("DELETE FROM proyecto_asesores");
  await db.execute("DELETE FROM proyectos");
  await db.execute("DELETE FROM residentes");
  await db.execute("DELETE FROM asesores");
  await db.execute("DELETE FROM jefes_vinculacion");
  await db.execute("DELETE FROM empresas");
  await db.execute("DELETE FROM usuarios");
  await db.execute("DELETE FROM fotos_perfil");
  await db.execute("SET FOREIGN_KEY_CHECKS = 1");
  console.log("🗑️   Tablas limpiadas.");

  // Insertar usuarios (jefes de vinculación)
  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);
  for (const u of USUARIOS) {
    await db.execute(
      "INSERT INTO usuarios (id, nombre, apellidos, correo, password_hash, rol, activo) VALUES (?,?,?,?,?,?,?)",
      [u.id, u.nombre, u.apellidos, u.correo, passwordHash, u.rol, true]
    );
  }
  console.log(`👤  ${USUARIOS.length} jefes de vinculación insertados.`);

  // Insertar jefes de vinculación
  for (const u of USUARIOS) {
    await db.execute(
      "INSERT INTO jefes_vinculacion (id, usuario_id, departamento) VALUES (?,?,?)",
      [u.id, u.id, "Vinculación"]
    );
  }
  console.log("👔  Jefes de vinculación insertados.");

  // Insertar empresas
  for (const e of EMPRESAS) {
    await db.execute(
      `INSERT INTO empresas (id, nombre, sector, ciudad, estado, convenio_vencimiento, contacto_nombre, contacto_email, contacto_telefono)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [e.id, e.nombre, e.sector, e.ciudad, e.estado, e.convenio_vencimiento, e.contacto_nombre, e.contacto_email, e.contacto_telefono]
    );
  }
  console.log(`🏢  ${EMPRESAS.length} empresas insertadas.`);

  await db.end();

  console.log("✅  Seed limpio completado exitosamente.");
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`  Contraseña de todos los usuarios: ${PASSWORD_PLAIN}`);
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  JEFES DE VINCULACIÓN:");
  USUARIOS.forEach((u) => {
    console.log(`    ${u.nombre} ${u.apellidos} — ${u.correo}`);
  });
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  EMPRESAS DISPONIBLES:");
  EMPRESAS.forEach((e) => {
    console.log(`    ${e.nombre} — ${e.sector}`);
  });
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  NOTA: Los asesores y residentes se crean manualmente a través del sistema.");
}

main().catch((err) => {
  console.error("Error en seed-clean.js:", err);
  process.exit(1);
});
