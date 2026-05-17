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
    progreso: 75,
    resIdx: 0,
  },
  {
    id: "PROY-2",
    titulo: "App CRM para PYME",
    desc: "Gestión de clientes para pequeñas empresas.",
    estado: "revision",
    prioridad: "Media",
    tech: "React Native, Firebase",
    progreso: 90,
    resIdx: 1,
  },
  {
    id: "PROY-3",
    titulo: "Portal de Comunicación Interna",
    desc: "Intranet corporativa con chat y gestión de documentos.",
    estado: "propuesto",
    prioridad: "Baja",
    tech: "Vue.js, Express, PostgreSQL",
    progreso: 15,
    resIdx: 2,
  },
  {
    id: "PROY-4",
    titulo: "Módulo de Analytics en Tiempo Real",
    desc: "Dashboard de métricas industriales conectado a IoT.",
    estado: "desarrollo",
    prioridad: "Alta",
    tech: "Python, MQTT, Grafana",
    progreso: 45,
    resIdx: 3,
  },
  {
    id: "PROY-5",
    titulo: "Dashboard de Analítica Industrial",
    desc: "Panel de KPIs para planta manufacturera.",
    estado: "concluido",
    prioridad: "Media",
    tech: "Power BI, Python, SQL",
    progreso: 100,
    resIdx: 4,
  },
  {
    id: "PROY-6",
    titulo: "App de Rastreo Logístico",
    desc: "Seguimiento de rutas de distribución con geolocalización.",
    estado: "desarrollo",
    prioridad: "Alta",
    tech: "React Native, Google Maps API",
    progreso: 60,
    resIdx: 5,
  },
  {
    id: "PROY-7",
    titulo: "Sistema de Gestión Agrícola",
    desc: "Control de cultivos y maquinaria.",
    estado: "propuesto",
    prioridad: "Baja",
    tech: "Laravel, MySQL, Arduino",
    progreso: 10,
    resIdx: 6,
  },
  {
    id: "PROY-8",
    titulo: "Automatización de Reportes Energía",
    desc: "Generación automática de informes de consumo eléctrico.",
    estado: "revision",
    prioridad: "Media",
    tech: "Python, pandas, Excel",
    progreso: 85,
    resIdx: 7,
  },
];

const FEEDBACKS = [
  "Diagnóstico inicial sólido. La fuente del proyecto está bien justificada. Procede con los parciales.",
  "Excelente diagnóstico inicial. Metas claras y medibles. Buen plan de trabajo definido.",
  "Buen avance de implementación. Se recomienda profundizar en documentación técnica y pruebas unitarias.",
  "Integración correcta de módulos. Agregar manual de usuario antes del reporte final.",
  "Proyecto finalizado satisfactoriamente. Resultados bien documentados. ¡Excelente trabajo!",
];

// Limites y fechas de entrega de cada tipo de reporte en la residencia
const LIMITES = [
  "2026-01-20",
  "2026-02-28",
  "2026-03-31",
  "2026-04-30",
  "2026-06-10",
];
const ENTREGAS = [
  "2026-01-18",
  "2026-02-25",
  "2026-03-28",
  "2026-04-28",
  "2026-06-08",
];
const TIPOS = ["preliminar", "parcial1", "parcial2", "parcial3", "final"];

// Días atrás desde hoy para fijar la fecha_entrega de reportes Pendientes
// (simulan entrega reciente, para que el asesor los vea como pendientes normales)
function fechaAtras(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}

// [aprobados, tienePendiente, diasAtrasEntrega]
// El pendiente se entregó hace N días (reciente, no miles de días)
const REPORTES_CONFIG = [
  [3, true, 7], // Ana       — Parcial 3 Pendiente (hace 7 días)
  [3, true, 5], // Sofía     — Parcial 3 Pendiente (hace 5 días)
  [1, true, 3], // Carmen    — Parcial 1 Pendiente (hace 3 días)
  [0, true, 2], // Diana     — Preliminar Pendiente (hace 2 días)
  [5, false, 0], // Luis      — Todo concluido
  [2, true, 6], // Pedro     — Parcial 2 Pendiente (hace 6 días)
  [2, true, 4], // Miguel    — Parcial 2 Pendiente (hace 4 días)
  [1, true, 8], // Roberto   — Parcial 1 Pendiente (hace 8 días)
];

async function seed() {
  const conn = await getConnection();
  console.log("✅  Conectado a MySQL.");

  try {
    await conn.execute("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of [
      "fuentes_informacion",
      "notificaciones",
      "citas",
      "reportes",
      "proyectos",
      "residentes",
      "asesores",
      "jefes_vinculacion",
      "empresas",
      "usuarios",
    ])
      await conn.execute(`TRUNCATE TABLE ${t}`);
    await conn.execute("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🗑️   Tablas limpiadas.");

    const hash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    for (const u of USUARIOS)
      await conn.execute(
        "INSERT INTO usuarios (id,nombre,apellidos,correo,password_hash,rol) VALUES (?,?,?,?,?,?)",
        [u.id, u.nombre, u.apellidos, u.correo, hash, u.rol],
      );
    console.log(`👤  ${USUARIOS.length} usuarios insertados.`);

    for (const e of EMPRESAS)
      await conn.execute(
        "INSERT INTO empresas (id,nombre,sector,ciudad,estado,convenio_vencimiento,contacto_nombre,contacto_email,contacto_telefono) VALUES (?,?,?,?,?,?,?,?,?)",
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
    console.log(`🏢  ${EMPRESAS.length} empresas insertadas.`);

    const asesorUsers = USUARIOS.filter((u) => u.rol === "asesor");
    const deptos = ["Ing. en Sistemas", "Ing. Industrial"];
    for (let i = 0; i < asesorUsers.length; i++) {
      const uid = asesorUsers[i].id;
      await conn.execute(
        "INSERT INTO asesores (id,usuario_id,departamento,num_empleado,max_residentes) VALUES (?,?,?,?,?)",
        [
          `ASE-${uid}`,
          uid,
          deptos[i] || "Ciencias Básicas",
          `EMP-${String(uid).padStart(4, "0")}`,
          12,
        ],
      );
    }
    console.log(`👨‍🏫  ${asesorUsers.length} asesores insertados.`);

    const jefeUser = USUARIOS.find((u) => u.rol === "jefe");
    await conn.execute(
      "INSERT INTO jefes_vinculacion (id,usuario_id,departamento) VALUES (?,?,?)",
      ["JEF-1", jefeUser.id, "Vinculación y Residencia Profesional"],
    );
    console.log("🎓  Jefe de vinculación insertado.");

    const residenteIds = [];
    for (let i = 0; i < RESIDENTES_CONFIG.length; i++) {
      const [uid, asesorId, empresaId, carrera, horas] = RESIDENTES_CONFIG[i];
      const resid = `RES-${uid}`;
      await conn.execute(
        `INSERT INTO residentes
           (id,usuario_id,num_control,carrera,semestre,empresa_id,asesor_id,
            horas_completadas,horas_requeridas,fecha_inicio,fecha_fin,estado)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          resid,
          uid,
          `21${String(uid).padStart(6, "0")}`,
          carrera,
          9,
          empresaId,
          asesorId,
          horas,
          480,
          "2026-01-13",
          "2026-07-13",
          "activo",
        ],
      );
      residenteIds.push(resid);
    }
    console.log(`🎒  ${residenteIds.length} residentes insertados.`);

    const asesorPorProyecto = {
      "PROY-1": "ASE-5",
      "PROY-2": "ASE-5",
      "PROY-3": "ASE-5",
      "PROY-4": "ASE-5",
      "PROY-5": "ASE-6",
      "PROY-6": "ASE-6",
      "PROY-7": "ASE-6",
      "PROY-8": "ASE-6",
    };
    for (const p of PROYECTOS) {
      const [, , empresaId] = RESIDENTES_CONFIG[p.resIdx];
      await conn.execute(
        `INSERT INTO proyectos
           (id,titulo,descripcion,empresa_id,residente_id,asesor_id,estado,prioridad,tecnologias,progreso)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          p.id,
          p.titulo,
          p.desc,
          empresaId,
          residenteIds[p.resIdx],
          asesorPorProyecto[p.id],
          p.estado,
          p.prioridad,
          p.tech,
          p.progreso,
        ],
      );
    }
    console.log(`🗂️   ${PROYECTOS.length} proyectos insertados.`);

    let totalReportes = 0;
    for (let ri = 0; ri < REPORTES_CONFIG.length; ri++) {
      const [aprobados, tienePendiente, diasAtras] = REPORTES_CONFIG[ri];
      const resid = residenteIds[ri];
      for (let t = 0; t < TIPOS.length; t++) {
        let estado, fechaEntrega, calificacion, feedback;
        if (t < aprobados) {
          estado = "Aprobado";
          fechaEntrega = ENTREGAS[t];
          calificacion = 75 + Math.floor(Math.random() * 25);
          feedback = FEEDBACKS[t];
        } else if (t === aprobados && tienePendiente) {
          estado = "Pendiente";
          fechaEntrega = fechaAtras(diasAtras); // ← fecha real reciente
          calificacion = null;
          feedback = null;
        } else {
          estado = "Pendiente";
          fechaEntrega = null; // ← null para no entregados aún
          calificacion = null;
          feedback = null;
        }
        await conn.execute(
          `INSERT INTO reportes
             (id,residente_id,tipo,fecha_limite,fecha_entrega,estado,calificacion,feedback)
           VALUES (?,?,?,?,?,?,?,?)`,
          [
            `REP-${resid}-${t + 1}`,
            resid,
            TIPOS[t],
            LIMITES[t],
            fechaEntrega,
            estado,
            calificacion,
            feedback,
          ],
        );
        totalReportes++;
      }
    }
    console.log(`📄  ${totalReportes} reportes insertados.`);

    const citas = [
      {
        sol: "1",
        par: "5",
        tipo: "Asesoría",
        motivo: "Revisión Parcial 3 — Sistema de Inventarios",
        fecha: "2026-05-22 10:00:00",
        lugar: "Sala 204",
        estado: "Confirmada",
      },
      {
        sol: "3",
        par: "5",
        tipo: "Revisión",
        motivo: "Entrega Parcial 3 — App CRM",
        fecha: "2026-05-23 09:00:00",
        lugar: "Oficina A3",
        estado: "Confirmada",
      },
      {
        sol: "8",
        par: "5",
        tipo: "Evaluación",
        motivo: "Revisión avance — Portal Comunicación Interna",
        fecha: "2026-05-28 11:00:00",
        lugar: "Virtual",
        estado: "Pendiente",
      },
      {
        sol: "10",
        par: "5",
        tipo: "Asesoría",
        motivo: "Kickoff — Módulo Analytics IoT",
        fecha: "2026-05-20 14:00:00",
        lugar: "Sala 102",
        estado: "Pendiente",
      },
      {
        sol: "2",
        par: "6",
        tipo: "Asesoría",
        motivo: "Cierre proyecto — Dashboard Industrial",
        fecha: "2026-05-21 10:00:00",
        lugar: "Virtual",
        estado: "Confirmada",
      },
      {
        sol: "4",
        par: "6",
        tipo: "Revisión",
        motivo: "Revisión Parcial 2 — App Rastreo Logístico",
        fecha: "2026-05-24 15:00:00",
        lugar: "Oficina B2",
        estado: "Pendiente",
      },
      {
        sol: "9",
        par: "6",
        tipo: "Evaluación",
        motivo: "Revisión Parcial 2 — Sistema Gestión Agrícola",
        fecha: "2026-05-26 09:30:00",
        lugar: "Sala 301",
        estado: "Confirmada",
      },
      {
        sol: "11",
        par: "6",
        tipo: "Asesoría",
        motivo: "Revisión Parcial 1 — Automatización Reportes",
        fecha: "2026-05-29 11:00:00",
        lugar: "Virtual",
        estado: "Pendiente",
      },
      {
        sol: "1",
        par: "7",
        tipo: "Asesoría",
        motivo: "Validación de fuente de información — Ana García",
        fecha: "2026-05-20 14:00:00",
        lugar: "Rectoría",
        estado: "Confirmada",
      },
    ];
    for (let i = 0; i < citas.length; i++) {
      const c = citas[i];
      await conn.execute(
        "INSERT INTO citas (id,solicitante_id,participante_id,tipo,motivo,fecha_hora,lugar,estado) VALUES (?,?,?,?,?,?,?,?)",
        [
          `CITA-${i + 1}`,
          c.sol,
          c.par,
          c.tipo,
          c.motivo,
          c.fecha,
          c.lugar,
          c.estado,
        ],
      );
    }
    console.log(`📅  ${citas.length} citas insertadas.`);

    const notifs = [
      {
        uid: "1",
        tipo: "Cita",
        titulo: "Cita confirmada con Asesor Marco",
        cuerpo: "Tu cita del 22 de mayo fue confirmada. Sala 204, 10:00 hrs.",
        icono: "calendar",
        leida: false,
      },
      {
        uid: "3",
        tipo: "Cita",
        titulo: "Cita de revisión confirmada",
        cuerpo: "El 23 de mayo revisarás tu Parcial 3 con el Asesor Marco.",
        icono: "calendar",
        leida: false,
      },
      {
        uid: "5",
        tipo: "Mensaje",
        titulo: "Reporte Parcial 3 recibido — Ana García",
        cuerpo: "Ana entregó su Reporte Parcial 3. Pendiente de revisión.",
        icono: "file-text",
        leida: false,
      },
      {
        uid: "5",
        tipo: "Mensaje",
        titulo: "Reporte Parcial 3 recibido — Sofía Martínez",
        cuerpo: "Sofía entregó su Parcial 3. Pendiente de revisión.",
        icono: "file-text",
        leida: false,
      },
      {
        uid: "7",
        tipo: "Alerta",
        titulo: "Convenio próximo a vencer",
        cuerpo: "InnovaLogística vence el 20 de junio de 2026.",
        icono: "alert-triangle",
        leida: false,
      },
      {
        uid: "7",
        tipo: "Alerta",
        titulo: "4 reportes pendientes de revisión (Marco)",
        cuerpo:
          "Ana, Sofía, Carmen y Diana tienen reportes esperando revisión.",
        icono: "clock",
        leida: false,
      },
      {
        uid: "2",
        tipo: "Reporte",
        titulo: "¡Proyecto concluido exitosamente!",
        cuerpo:
          "Tu Reporte Final fue aprobado. Calificación: 95. ¡Felicidades!",
        icono: "award",
        leida: true,
      },
      {
        uid: "8",
        tipo: "Cita",
        titulo: "Reunión de kickoff agendada",
        cuerpo: "El 28 de mayo revisarás el avance de tu portal interno.",
        icono: "calendar",
        leida: false,
      },
      {
        uid: "4",
        tipo: "Reporte",
        titulo: "Reporte Parcial 2 en revisión",
        cuerpo:
          "Tu asesor recibió tu Reporte Parcial 2. Espera retroalimentación.",
        icono: "file-text",
        leida: true,
      },
      {
        uid: "7",
        tipo: "Alerta",
        titulo: "Carmen y Diana sin Parcial 1/Preliminar",
        cuerpo: "Revisar avance de los residentes de Marco con retraso.",
        icono: "user-plus",
        leida: false,
      },
    ];
    for (let i = 0; i < notifs.length; i++) {
      const n = notifs[i];
      await conn.execute(
        "INSERT INTO notificaciones (id,usuario_id,tipo,titulo,cuerpo,icono,leida) VALUES (?,?,?,?,?,?,?)",
        [`NOT-${i + 1}`, n.uid, n.tipo, n.titulo, n.cuerpo, n.icono, n.leida],
      );
    }
    console.log(`🔔  ${notifs.length} notificaciones insertadas.`);

    const fuentes = [
      {
        res: residenteIds[0],
        tipo: "propia",
        desc: "Propuesta propia: sistema de control de inventarios",
        estado: "Validada",
        obs: "Bien fundamentada, aprobada sin cambios.",
      },
      {
        res: residenteIds[1],
        tipo: "banco",
        desc: "Proyecto del banco institucional: app CRM para PYME",
        estado: "Validada",
        obs: "Aprobada sin observaciones.",
      },
      {
        res: residenteIds[2],
        tipo: "empresa",
        desc: "Propuesta de la empresa: portal de comunicación interna",
        estado: "Pendiente",
        obs: null,
      },
      {
        res: residenteIds[3],
        tipo: "propia",
        desc: "Iniciativa propia: módulo de analytics con IoT",
        estado: "Pendiente",
        obs: null,
      },
      {
        res: residenteIds[4],
        tipo: "banco",
        desc: "Banco: dashboard de analítica industrial",
        estado: "Validada",
        obs: "Aprobada. Proyecto concluido satisfactoriamente.",
      },
      {
        res: residenteIds[5],
        tipo: "empresa",
        desc: "Empresa propone rastreo logístico en tiempo real",
        estado: "Validada",
        obs: "Validada con observaciones menores sobre alcance.",
      },
      {
        res: residenteIds[6],
        tipo: "propia",
        desc: "Propuesta de sistema de gestión agrícola con sensores",
        estado: "Pendiente",
        obs: null,
      },
      {
        res: residenteIds[7],
        tipo: "empresa",
        desc: "Empresa: automatización de reportes de consumo eléctrico",
        estado: "Pendiente",
        obs: null,
      },
    ];
    for (let i = 0; i < fuentes.length; i++) {
      const f = fuentes[i];
      await conn.execute(
        `INSERT INTO fuentes_informacion
           (id,residente_id,tipo,descripcion,estado,revisado_por,fecha_revision,observaciones)
         VALUES (?,?,?,?,?,?,?,?)`,
        [
          `FUENTE-${i + 1}`,
          f.res,
          f.tipo,
          f.desc,
          f.estado,
          f.estado === "Validada" ? jefeUser.id : null,
          f.estado === "Validada" ? "2026-01-20" : null,
          f.obs,
        ],
      );
    }
    console.log(`📚  ${fuentes.length} fuentes insertadas.`);

    console.log("\n🎉  Seed completado exitosamente.");
    console.log("🔑  Contraseña de todos los usuarios: vinculatec123");
    console.log(
      "─────────────────────────────────────────────────────────────",
    );
    console.log("  GRUPO MARCO REYES (marco.reyes@itm.edu.mx):");
    console.log("    ana.garcia     — 3 aceptados, Parcial 3 Pendiente ⏳");
    console.log("    sofia.martinez — 3 aceptados, Parcial 3 Pendiente ⏳");
    console.log("    carmen.lopez   — 1 aceptado,  Parcial 1 Pendiente ⏳");
    console.log("    diana.flores   — 0 aceptados, Preliminar Pendiente ⏳");
    console.log("  GRUPO LAURA VEGA (laura.vega@itm.edu.mx):");
    console.log("    luis.hernandez  — 5 aceptados (proyecto concluido) ✅");
    console.log("    pedro.ramirez   — 2 aceptados, Parcial 2 Pendiente ⏳");
    console.log("    miguel.torres   — 2 aceptados, Parcial 2 Pendiente ⏳");
    console.log("    roberto.sanchez — 1 aceptado,  Parcial 1 Pendiente ⏳");
    console.log("  JEFE: director@itm.edu.mx");
  } catch (err) {
    console.error("❌  Error en seed:", err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

seed();
