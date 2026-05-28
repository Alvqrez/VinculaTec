/**
 * VinculaTec — seedVacia.js
 * Seed mínimo: 1 usuario por rol para pruebas rápidas.
 *
 * Crea:
 *   - 1 Jefe de Vinculación
 *   - 1 Asesor
 *   - 2 Residentes en el MISMO proyecto (para probar la selección por residente)
 *
 * Uso:
 *   cd backend
 *   node seedVacia.js
 *
 * Credenciales:
 *   jefe@test.mx       / test123
 *   asesor@test.mx     / test123
 *   residente1@test.mx / test123
 *   residente2@test.mx / test123
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
  });
}

async function seed() {
  const conn = await getConnection();
  console.log("✅  Conectado a MySQL.");

  try {
    // Limpiar tablas (orden: hijos antes que padres)
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of [
      "fuentes_informacion",
      "notificaciones",
      "citas",
      "reportes",
      "proyecto_asesores",
      "proyectos",
      "residentes",
      "asesores",
      "jefes_vinculacion",
      "empresas",
      "usuarios",
    ]) {
      await conn.execute(`TRUNCATE TABLE ${t}`);
    }
    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🗑️   Tablas limpiadas.");

    const hash = await bcrypt.hash("test123", 10);

    // ── Usuarios ──────────────────────────────────────────────────────────────
    const usuarios = [
      {
        id: "1",
        nombre: "Juan",
        apellidos: "Pérez López",
        correo: "residente1@test.mx",
        rol: "residente",
      },
      {
        id: "2",
        nombre: "María",
        apellidos: "González Torres",
        correo: "residente2@test.mx",
        rol: "residente",
      },
      {
        id: "3",
        nombre: "Carlos",
        apellidos: "Asesor Méndez",
        correo: "asesor@test.mx",
        rol: "asesor",
      },
      {
        id: "4",
        nombre: "Roberto",
        apellidos: "Jefe Vinculación",
        correo: "jefe@test.mx",
        rol: "jefe",
      },
    ];

    for (const u of usuarios) {
      await conn.execute(
        "INSERT INTO usuarios (id, nombre, apellidos, correo, password_hash, rol) VALUES (?,?,?,?,?,?)",
        [u.id, u.nombre, u.apellidos, u.correo, hash, u.rol],
      );
    }
    console.log("👤  4 usuarios insertados.");

    // ── Empresa ───────────────────────────────────────────────────────────────
    await conn.execute(
      "INSERT INTO empresas (id, nombre, sector, ciudad, estado, convenio_vencimiento, contacto_nombre, contacto_email, contacto_telefono) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        "EMP-1",
        "TechDemo SA",
        "Tecnología",
        "Veracruz",
        "Activa",
        "2026-12-31",
        "Ing. Demo",
        "demo@techdemo.mx",
        "2291234567",
      ],
    );
    console.log("🏢  1 empresa insertada.");

    // ── Asesor ────────────────────────────────────────────────────────────────
    await conn.execute(
      "INSERT INTO asesores (id, usuario_id, departamento, num_empleado, max_residentes) VALUES (?,?,?,?,?)",
      ["ASE-3", "3", "Ing. en Sistemas", "EMP-0003", 12],
    );
    console.log("👨‍🏫  1 asesor insertado.");

    // ── Jefe ──────────────────────────────────────────────────────────────────
    await conn.execute(
      "INSERT INTO jefes_vinculacion (id, usuario_id, departamento) VALUES (?,?,?)",
      ["JEF-1", "4", "Vinculación y Residencia Profesional"],
    );
    console.log("🎓  1 jefe insertado.");

    // ── Residentes ────────────────────────────────────────────────────────────
    const residentes = [
      {
        id: "RES-1",
        uid: "1",
        num: "210000001",
        carrera: "Ing. en Sistemas",
        horas: 0,
      },
      {
        id: "RES-2",
        uid: "2",
        num: "210000002",
        carrera: "Ing. en Sistemas",
        horas: 120,
      },
    ];
    for (const r of residentes) {
      await conn.execute(
        `INSERT INTO residentes
           (id, usuario_id, num_control, carrera, semestre, empresa_id, asesor_id,
            horas_completadas, horas_requeridas, fecha_inicio, fecha_fin, estado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          r.id,
          r.uid,
          r.num,
          r.carrera,
          9,
          "EMP-1",
          "ASE-3",
          r.horas,
          480,
          "2026-01-13",
          "2026-07-13",
          "activo",
        ],
      );
    }
    console.log("🎒  2 residentes insertados.");

    // ── Proyecto compartido (2 residentes, mismo asesor) ──────────────────────
    await conn.execute(
      `INSERT INTO proyectos (id, titulo, descripcion, empresa_id, residente_id, asesor_id, estado, prioridad, tecnologias, progreso)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        "PROY-1",
        "Sistema de Gestión Escolar",
        "Módulo web para control académico en tiempo real.",
        "EMP-1",
        "RES-1",
        "ASE-3",
        "desarrollo",
        "Alta",
        "React, Node.js, MySQL",
        30,
      ],
    );

    // Registrar también la relación en proyecto_asesores
    await conn.execute(
      "INSERT INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?,?)",
      ["PROY-1", "ASE-3"],
    );
    console.log("🗂️   1 proyecto insertado (con 2 residentes).");

    // ── Reportes (5 por residente) ────────────────────────────────────────────
    const reportes = [
      // Residente 1 — preliminar aprobado, puede entregar parciales
      {
        id: "REP-RES1-1",
        rid: "RES-1",
        tipo: "preliminar",
        limite: "2026-02-15",
        entrega: "2026-02-14",
        estado: "Aprobado",
      },
      {
        id: "REP-RES1-2",
        rid: "RES-1",
        tipo: "parcial1",
        limite: "2026-03-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES1-3",
        rid: "RES-1",
        tipo: "parcial2",
        limite: "2026-04-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES1-4",
        rid: "RES-1",
        tipo: "parcial3",
        limite: "2026-05-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES1-5",
        rid: "RES-1",
        tipo: "final",
        limite: "2026-06-15",
        entrega: null,
        estado: "Pendiente",
      },
      // Residente 2 — todo pendiente
      {
        id: "REP-RES2-1",
        rid: "RES-2",
        tipo: "preliminar",
        limite: "2026-02-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES2-2",
        rid: "RES-2",
        tipo: "parcial1",
        limite: "2026-03-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES2-3",
        rid: "RES-2",
        tipo: "parcial2",
        limite: "2026-04-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES2-4",
        rid: "RES-2",
        tipo: "parcial3",
        limite: "2026-05-15",
        entrega: null,
        estado: "Pendiente",
      },
      {
        id: "REP-RES2-5",
        rid: "RES-2",
        tipo: "final",
        limite: "2026-06-15",
        entrega: null,
        estado: "Pendiente",
      },
    ];

    for (const r of reportes) {
      await conn.execute(
        `INSERT INTO reportes (id, residente_id, tipo, fecha_limite, fecha_entrega, estado) VALUES (?,?,?,?,?,?)`,
        [r.id, r.rid, r.tipo, r.limite, r.entrega, r.estado],
      );
    }
    console.log("📄  10 reportes insertados (5 por residente).");

    // ── Fuente de información para Residente 1 ────────────────────────────────
    await conn.execute(
      `INSERT INTO fuentes_informacion (id, residente_id, tipo, descripcion, estado, revisado_por, fecha_revision, observaciones)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        "FUENTE-1",
        "RES-1",
        "propia",
        "Sistema de control académico propuesto por el residente",
        "Validada",
        "4",
        "2026-01-15",
        "Aprobada sin observaciones.",
      ],
    );
    console.log("📚  1 fuente insertada.");

    // ── Notificaciones de bienvenida ──────────────────────────────────────────
    // Columnas correctas según schema:
    //   tipo_notificacion  ENUM('REVISION','AVANCE','SISTEMA')
    //   mensaje            TEXT
    //   icon               VARCHAR(50)
    //   is_read            BOOLEAN
    //   id                 INT AUTO_INCREMENT  → no se inserta manualmente
    const notifs = [
      {
        uid: "1",
        tipo: "SISTEMA",
        titulo: "¡Bienvenido al sistema!",
        mensaje:
          "Tu reporte preliminar fue aceptado. Ya puedes entregar tus reportes parciales.",
        icon: "check-circle",
      },
      {
        uid: "2",
        tipo: "SISTEMA",
        titulo: "¡Bienvenida al sistema!",
        mensaje: "Entrega tu reporte preliminar para iniciar el seguimiento.",
        icon: "info",
      },
      {
        uid: "3",
        tipo: "SISTEMA",
        titulo: "Tienes residentes pendientes",
        mensaje: "Revisa los reportes de tus residentes.",
        icon: "bell",
      },
      {
        uid: "4",
        tipo: "SISTEMA",
        titulo: "Residentes activos",
        mensaje: "Tienes 2 residentes activos este semestre.",
        icon: "users",
      },
    ];

    for (const n of notifs) {
      await conn.execute(
        "INSERT INTO notificaciones (usuario_id, tipo_notificacion, titulo, mensaje, icon, is_read) VALUES (?,?,?,?,?,?)",
        [n.uid, n.tipo, n.titulo, n.mensaje, n.icon, false],
      );
    }
    console.log("🔔  4 notificaciones insertadas.");

    console.log("\n🎉  seedVacia completado exitosamente.");
    console.log("🔑  Contraseña de todos los usuarios: test123");
    console.log("──────────────────────────────────────────────");
    console.log("  RESIDENTE 1:  residente1@test.mx");
    console.log(
      "                Preliminar ACEPTADO → puede entregar parciales",
    );
    console.log("  RESIDENTE 2:  residente2@test.mx");
    console.log("                Sin reportes entregados");
    console.log("  ASESOR:       asesor@test.mx");
    console.log("  JEFE:         jefe@test.mx");
  } catch (err) {
    console.error("❌  Error en seedVacia:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
