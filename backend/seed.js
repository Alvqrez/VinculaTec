/**
 * VinculaTec — seed.js
 * Pobla la base de datos con datos de prueba realistas para 2026.
 *
 * Uso:
 *   cd backend && node seed.js
 *
 * Estados de reportes (alineados con el frontend):
 *   "Aceptado"    — revisado y aprobado por el asesor
 *   "Pendiente"   — enviado, esperando revisión
 *   "Por corregir"— rechazado, requiere reenvío
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

const USUARIOS = [
  {
    id: "1",
    nombre: "Ana",
    apellidos: "García Mendoza",
    correo: "ana.garcia@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "3",
    nombre: "Sofía",
    apellidos: "Martínez López",
    correo: "sofia.martinez@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "8",
    nombre: "Carmen",
    apellidos: "López Herrera",
    correo: "carmen.lopez@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "10",
    nombre: "Diana",
    apellidos: "Flores Gutiérrez",
    correo: "diana.flores@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "2",
    nombre: "Luis",
    apellidos: "Hernández Ruiz",
    correo: "luis.hernandez@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "4",
    nombre: "Pedro",
    apellidos: "Ramírez Gómez",
    correo: "pedro.ramirez@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "9",
    nombre: "Miguel",
    apellidos: "Torres Castillo",
    correo: "miguel.torres@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "11",
    nombre: "Roberto",
    apellidos: "Sánchez Vidal",
    correo: "roberto.sanchez@itm.edu.mx",
    rol: "residente",
  },
  {
    id: "5",
    nombre: "Marco",
    apellidos: "Reyes Hernández",
    correo: "marco.reyes@itm.edu.mx",
    rol: "asesor",
  },
  {
    id: "6",
    nombre: "Laura",
    apellidos: "Vega Jiménez",
    correo: "laura.vega@itm.edu.mx",
    rol: "asesor",
  },
  {
    id: "7",
    nombre: "Carlos",
    apellidos: "Mendoza Pérez",
    correo: "director@itm.edu.mx",
    rol: "jefe",
  },
];

const EMPRESAS = [
  {
    id: "EMP-1",
    nombre: "SoftSolutions SA",
    sector: "Tecnología",
    ciudad: "Monterrey",
    estado: "Activa",
    convenio_vencimiento: "2026-08-31",
    contacto_nombre: "Ing. Flores",
    contacto_email: "flores@softsolutions.mx",
    contacto_telefono: "8112345678",
  },
  {
    id: "EMP-2",
    nombre: "DataCore MX",
    sector: "Datos & IA",
    ciudad: "CDMX",
    estado: "Activa",
    convenio_vencimiento: "2026-12-15",
    contacto_nombre: "Lic. Torres",
    contacto_email: "torres@datacore.mx",
    contacto_telefono: "5512345678",
  },
  {
    id: "EMP-3",
    nombre: "InnovaLogística",
    sector: "Logística",
    ciudad: "Guadalajara",
    estado: "Por Vencer",
    convenio_vencimiento: "2026-06-20",
    contacto_nombre: "Ing. Ramírez",
    contacto_email: "iramirez@innova.mx",
    contacto_telefono: "3312345678",
  },
  {
    id: "EMP-4",
    nombre: "TecnoAgro del Norte",
    sector: "Agroindustria",
    ciudad: "Hermosillo",
    estado: "Nueva",
    convenio_vencimiento: "2026-09-30",
    contacto_nombre: "Dr. Estrada",
    contacto_email: "estrada@tecnoagro.mx",
    contacto_telefono: "6621234567",
  },
  {
    id: "EMP-5",
    nombre: "RedMovil MX",
    sector: "Telecom",
    ciudad: "Monterrey",
    estado: "Activa",
    convenio_vencimiento: "2026-09-10",
    contacto_nombre: "Ing. Salinas",
    contacto_email: "salinas@redmovil.mx",
    contacto_telefono: "8129876543",
  },
  {
    id: "EMP-6",
    nombre: "EcoEnergía Verde",
    sector: "Energía",
    ciudad: "Veracruz",
    estado: "Nueva",
    convenio_vencimiento: "2026-11-30",
    contacto_nombre: "Dra. Moreno",
    contacto_email: "moreno@ecoenergia.mx",
    contacto_telefono: "2291234567",
  },
];

// [usuarioId, asesorId, empresaId, carrera, horasCompletadas]
const RESIDENTES_CONFIG = [
  ["1", "ASE-5", "EMP-1", "Ing. en Sistemas de Información", 360],
  ["3", "ASE-5", "EMP-2", "Ing. en Sistemas de Información", 240],
  ["8", "ASE-5", "EMP-5", "Ing. en Sistemas de Información", 120],
  ["10", "ASE-5", "EMP-6", "Ing. Electrónica", 60],
  ["2", "ASE-6", "EMP-2", "Ing. Industrial", 480],
  ["4", "ASE-6", "EMP-3", "Ing. Industrial", 180],
  ["9", "ASE-6", "EMP-4", "Ing. en Gestión Empresarial", 300],
  ["11", "ASE-6", "EMP-1", "Ing. Electrónica", 90],
];

const PROYECTOS = [
  {
    id: "PROY-1",
    titulo: "Sistema de Gestión de Inventarios",
    desc: "Módulo web para control de almacén en tiempo real.",
    estado: "desarrollo",
    prioridad: "Alta",
    tech: "React, Node.js, MySQL",
  },
  {
    id: "PROY-2",
    titulo: "Dashboard Analytics en Tiempo Real",
    desc: "Visualización de datos con gráficos dinámicos.",
    estado: "revision",
    prioridad: "Alta",
    tech: "React, D3.js, WebSocket",
  },
  {
    id: "PROY-3",
    titulo: "API REST para Gestión de Proyectos",
    desc: "Backend escalable con autenticación JWT.",
    estado: "desarrollo",
    prioridad: "Media",
    tech: "Node.js, Express, MySQL",
  },
  {
    id: "PROY-4",
    titulo: "Mobile App para Logística",
    desc: "Aplicación móvil de rastreo en tiempo real.",
    estado: "propuesto",
    prioridad: "Media",
    tech: "React Native, Firebase",
  },
  {
    id: "PROY-5",
    titulo: "Sistema de Recomendaciones con IA",
    desc: "Motor de recomendaciones basado en ML.",
    estado: "desarrollo",
    prioridad: "Alta",
    tech: "Python, TensorFlow, Node.js",
  },
  {
    id: "PROY-6",
    titulo: "Portal de Estudiantes",
    desc: "Plataforma educativa con seguimiento académico.",
    estado: "revision",
    prioridad: "Media",
    tech: "Vue.js, Laravel, PostgreSQL",
  },
  {
    id: "PROY-7",
    titulo: "Integración SAP",
    desc: "Conectividad con ERP empresarial.",
    estado: "propuesto",
    prioridad: "Baja",
    tech: "Java, SAP SDK",
  },
  {
    id: "PROY-8",
    titulo: "App de E-Commerce",
    desc: "Plataforma de compra-venta de productos.",
    estado: "desarrollo",
    prioridad: "Alta",
    tech: "Next.js, Stripe, PostgreSQL",
  },
];

async function seed() {
  let conn;
  try {
    conn = await getConnection();
    console.log("✅ Conexión a BD establecida\n");

    // ─────── USUARIOS ───────────────────────────────────────────────────────
    console.log("👤 Creando usuarios...");
    const hashedPassword = await bcrypt.hash(PASSWORD_PLAIN, 10);
    for (const u of USUARIOS) {
      await conn.execute(
        "INSERT IGNORE INTO usuarios (id, nombre, apellidos, correo, password_hash, rol, activo) VALUES (?,?,?,?,?,?,?)",
        [u.id, u.nombre, u.apellidos, u.correo, hashedPassword, u.rol, 1],
      );
    }
    console.log(`✅ ${USUARIOS.length} usuarios creados.\n`);

    // ─────── EMPRESAS ───────────────────────────────────────────────────────
    console.log("🏢 Creando empresas...");
    for (const e of EMPRESAS) {
      await conn.execute(
        "INSERT IGNORE INTO empresas (id, nombre, sector, ciudad, estado, convenio_vencimiento, contacto_nombre, contacto_email, contacto_telefono) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          e.id,
          e.nombre,
          e.sector,
          e.ciudad,
          e.estado,
          e.convenio_vencimiento,
          e.contacto_nombre,
          e.contacto_email,
          e.contacto_telefono,
        ],
      );
    }
    console.log(`✅ ${EMPRESAS.length} empresas creadas.\n`);

    // ─────── ASESORES ──────────────────────────────────────────────────────
    console.log("👨‍🏫 Creando asesores...");
    await conn.execute(
      "INSERT IGNORE INTO asesores (id, usuario_id, departamento, num_empleado, max_residentes) VALUES (?,?,?,?,?)",
      ["ASE-5", "5", "Ciencias Básicas", "EMP-0005", 5],
    );
    await conn.execute(
      "INSERT IGNORE INTO asesores (id, usuario_id, departamento, num_empleado, max_residentes) VALUES (?,?,?,?,?)",
      ["ASE-6", "6", "Ingeniería", "EMP-0006", 4],
    );
    console.log("✅ 2 asesores creados.\n");

    // ─────── JEFE DE VINCULACIÓN ────────────────────────────────────────────
    console.log("👑 Creando jefe de vinculación...");
    await conn.execute(
      "INSERT IGNORE INTO jefes_vinculacion (id, usuario_id, departamento) VALUES (?,?,?)",
      ["JEF-1", "7", "Vinculación"],
    );
    console.log("✅ 1 jefe creado.\n");

    // ─────── RESIDENTES ────────────────────────────────────────────────────
    console.log("🎓 Creando residentes...");
    let totalResidentes = 0;
    for (const [uid, aid, eid, carrera, horas] of RESIDENTES_CONFIG) {
      const numControl = `EMP${2026}${String(uid).padStart(3, "0")}`;
      await conn.execute(
        "INSERT IGNORE INTO residentes (id, usuario_id, num_control, carrera, semestre, empresa_id, asesor_id, horas_completadas, horas_requeridas, fecha_inicio, fecha_fin, estado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          `RES-${uid}`,
          uid,
          numControl,
          carrera,
          8,
          eid,
          aid,
          horas,
          480,
          "2026-01-20",
          "2026-08-31",
          "activo",
        ],
      );
      totalResidentes++;
    }
    console.log(`✅ ${totalResidentes} residentes creados.\n`);

    // ─────── PROYECTOS ────────────────────────────────────────────────────
    console.log("📋 Creando proyectos...");
    const proyectosUsados = [
      "PROY-1",
      "PROY-2",
      "PROY-3",
      "PROY-5",
      "PROY-6",
      "PROY-8",
    ];
    for (
      let i = 0;
      i < proyectosUsados.length && i < RESIDENTES_CONFIG.length;
      i++
    ) {
      const p = PROYECTOS.find((x) => x.id === proyectosUsados[i]);
      const [uid, aid, eid] = RESIDENTES_CONFIG[i];
      await conn.execute(
        "INSERT IGNORE INTO proyectos (id, titulo, descripcion, empresa_id, residente_id, asesor_id, periodo, estado, prioridad, tecnologias, progreso) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [
          p.id,
          p.titulo,
          p.desc,
          eid,
          `RES-${uid}`,
          aid,
          "2026-1",
          p.estado,
          p.prioridad,
          p.tech,
          Math.floor(Math.random() * 100),
        ],
      );
    }
    console.log(`✅ ${proyectosUsados.length} proyectos creados.\n`);

    // ─────── PROYECTO-ASESORES ─────────────────────────────────────────────
    console.log("🔗 Vinculando asesores a proyectos...");
    for (
      let i = 0;
      i < proyectosUsados.length && i < RESIDENTES_CONFIG.length;
      i++
    ) {
      const [, aid] = RESIDENTES_CONFIG[i];
      await conn.execute(
        "INSERT IGNORE INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?,?)",
        [proyectosUsados[i], aid],
      );
    }
    console.log("✅ Asesores vinculados.\n");

    // ─────── REPORTES ──────────────────────────────────────────────────────
    console.log("📄 Creando reportes...");
    const TIPOS = ["preliminar", "parcial1", "parcial2", "parcial3", "final"];
    const LIMITES = [
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
      "2026-05-15",
      "2026-06-15",
    ];
    const FEEDBACK = [
      "Excelente análisis del diagnóstico. Amplio alcance del proyecto.",
      "Falta profundidad en algunos aspectos. Revisar la justificación.",
      "Buen progreso. Considerar agregar métricas de desempeño.",
      "Documentación clara y completa. Arreglar pequeños detalles.",
      "Proyecto concluido exitosamente. Felicidades.",
    ];
    let totalReportes = 0;

    for (const [uid] of RESIDENTES_CONFIG) {
      for (let t = 0; t < TIPOS.length; t++) {
        let estado,
          fechaEntrega,
          calificacion,
          feedback,
          archivoUrl,
          nombreArchivo;

        if (t < 3) {
          // Primeros 3 reportes: entregados y revisados
          estado = "Aprobado";
          fechaEntrega = new Date(LIMITES[t]);
          fechaEntrega.setDate(
            fechaEntrega.getDate() - Math.floor(Math.random() * 5),
          );
          fechaEntrega = fechaEntrega.toISOString().split("T")[0];
          calificacion = 85 + Math.floor(Math.random() * 15);
          feedback = FEEDBACK[t];
          // FIX: En lugar de data URI con base64, usamos una ruta simple que simula
          // un archivo subido al servidor. En producción, esto sería una URL real.
          archivoUrl = `/uploads/reporte_${TIPOS[t]}_${uid}.pdf`;
          nombreArchivo = `reporte_${TIPOS[t]}_${uid}.pdf`;
        } else if (t < 4) {
          // Reporte 4: pendiente de revisión
          estado = "Entregado";
          fechaEntrega = LIMITES[t];
          calificacion = null;
          feedback = null;
          archivoUrl = `/uploads/reporte_${TIPOS[t]}_${uid}.pdf`;
          nombreArchivo = `reporte_${TIPOS[t]}_${uid}.pdf`;
        } else {
          // Reporte final: pendiente
          estado = "Pendiente";
          fechaEntrega = null;
          calificacion = null;
          feedback = null;
          archivoUrl = null;
          nombreArchivo = null;
        }

        await conn.execute(
          `INSERT INTO reportes
             (id,residente_id,tipo,fecha_limite,fecha_entrega,estado,calificacion,feedback,archivo_url,nombre_archivo)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [
            `REP-${uid}-${t + 1}`,
            `RES-${uid}`,
            TIPOS[t],
            LIMITES[t],
            fechaEntrega,
            estado,
            calificacion,
            feedback,
            archivoUrl,
            nombreArchivo,
          ],
        );
        totalReportes++;
      }
    }
    console.log(`✅ ${totalReportes} reportes creados.\n`);

    // ─────── CITAS ──────────────────────────────────────────────────────────
    console.log("📅 Creando citas...");
    const citas = [
      {
        sol: "1",
        par: "5",
        tipo: "Asesoría",
        motivo: "Revisión Parcial 3 — Sistema de Inventarios",
      },
      {
        sol: "3",
        par: "5",
        tipo: "Revisión",
        motivo: "Retroalimentación del Dashboard",
      },
      {
        sol: "5",
        par: "2",
        tipo: "Evaluación",
        motivo: "Defensa del proyecto API REST",
      },
      {
        sol: "4",
        par: "6",
        tipo: "Asesoría",
        motivo: "Consulta sobre logística",
      },
      {
        sol: "6",
        par: "9",
        tipo: "Revisión",
        motivo: "Avance del proyecto de IA",
      },
      {
        sol: "11",
        par: "5",
        tipo: "Otro",
        motivo: "Cambio de tema de proyecto",
      },
    ];

    let citasInsertadas = 0;
    for (const c of citas) {
      const fecha = new Date("2026-06-15");
      fecha.setDate(fecha.getDate() + Math.floor(Math.random() * 30));
      fecha.setHours(9 + Math.floor(Math.random() * 8));

      await conn.execute(
        "INSERT IGNORE INTO citas (id, solicitante_id, participante_id, tipo, motivo, fecha_hora, lugar, estado) VALUES (?,?,?,?,?,?,?,?)",
        [
          `CIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          c.sol,
          c.par,
          c.tipo,
          c.motivo,
          fecha.toISOString().replace("T", " ").substring(0, 19),
          "Oficina de Vinculación",
          "Pendiente",
        ],
      );
      citasInsertadas++;
    }
    console.log(`✅ ${citasInsertadas} citas creadas.\n`);

    // ─────── NOTIFICACIONES ────────────────────────────────────────────────
    console.log("🔔 Creando notificaciones...");
    const notificaciones = [
      {
        userId: "1",
        tipo: "Reporte",
        titulo: "Reporte Parcial 1 entregado",
        cuerpo: "Tu reporte ha sido revisado.",
      },
      {
        userId: "3",
        tipo: "Alerta",
        titulo: "Próxima cita con asesor",
        cuerpo: "Tu cita está programada para el 25 de junio.",
      },
      {
        userId: "2",
        tipo: "Logro",
        titulo: "¡Felicidades!",
        cuerpo: "Has completado la Parcial 3 exitosamente.",
      },
      {
        userId: "5",
        tipo: "Mensaje",
        titulo: "Nuevo estudiante asignado",
        cuerpo: "Diana Flores se unió a tu grupo.",
      },
    ];

    for (const n of notificaciones) {
      await conn.execute(
        "INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, leida, icono, created_at) VALUES (?,?,?,?,?,?,NOW())",
        [n.userId, n.tipo, n.titulo, n.cuerpo, false, "bell"],
      );
    }
    console.log(`✅ ${notificaciones.length} notificaciones creadas.\n`);

    // ─────── FOTOS DE PERFIL ────────────────────────────────────────────────
    console.log("🖼️  Reservando tabla de fotos...");
    for (const u of USUARIOS) {
      await conn.execute(
        "INSERT IGNORE INTO fotos_perfil (usuario_id, foto_base64) VALUES (?,?)",
        [u.id, null],
      );
    }
    console.log("✅ Tabla de fotos lista.\n");

    console.log("═══════════════════════════════════════════════════");
    console.log("✨ SEED COMPLETADO EXITOSAMENTE");
    console.log("═══════════════════════════════════════════════════");
    console.log(`\n📊 Resumen:`);
    console.log(`   • ${USUARIOS.length} usuarios`);
    console.log(`   • ${EMPRESAS.length} empresas`);
    console.log(`   • 2 asesores + 1 jefe`);
    console.log(`   • ${totalResidentes} residentes`);
    console.log(`   • ${proyectosUsados.length} proyectos`);
    console.log(`   • ${totalReportes} reportes`);
    console.log(`   • ${citasInsertadas} citas`);
    console.log(`   • ${notificaciones.length} notificaciones\n`);

    await conn.end();
  } catch (err) {
    console.error("❌  Error en seed:", err.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

seed();
