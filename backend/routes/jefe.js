const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { auth, requireRol } = require("../middleware");
const {
  validateRequest,
  schemas,
  errorHandler,
} = require("../middleware/validation");
const { createError, ERROR_CODES } = require("../utils/errorCodes");
const { logger } = require("../utils/logger");

const router = express.Router();

// SEGURIDAD FIX #3: Todas las rutas del jefe requieren rol "jefe"
// Antes: auth solo verificaba que el token fuera válido, cualquier rol podía acceder
const soloJefe = [auth, requireRol("jefe")];

// ── GET /api/jefe/dashboard ───────────────────────────────────────────────────
router.get("/dashboard", ...soloJefe, async (req, res) => {
  try {
    logger.logBusinessOperation("jefe_dashboard_access", req.user.id, {
      endpoint: "/dashboard",
    });

    const [[{ totalResidentes }]] = await db.execute(
      "SELECT COUNT(*) AS totalResidentes FROM residentes WHERE estado = 'activo'",
    );
    const [[{ empresasVinculadas }]] = await db.execute(
      "SELECT COUNT(*) AS empresasVinculadas FROM empresas",
    );
    const [[{ proyectosActivos }]] = await db.execute(
      "SELECT COUNT(*) AS proyectosActivos FROM proyectos WHERE estado IN ('desarrollo','revision')",
    );
    const [[{ reportesPendientes }]] = await db.execute(
      "SELECT COUNT(*) AS reportesPendientes FROM reportes WHERE estado IN ('Pendiente','En Revisión')",
    );
    const [topEmpresas] = await db.execute(
      `SELECT e.id, e.nombre, e.estado,
              COUNT(DISTINCT p.id) AS proyectos,
              COUNT(DISTINCT r.id) AS residentes
       FROM empresas e
       LEFT JOIN proyectos p ON p.empresa_id = e.id
       LEFT JOIN residentes r ON r.empresa_id = e.id AND r.estado = 'activo'
       GROUP BY e.id
       ORDER BY residentes DESC
       LIMIT 6`,
    );
    return res.json({
      ok: true,
      stats: {
        totalResidentes,
        empresasVinculadas,
        proyectosActivos,
        reportesPendientes,
      },
      topEmpresas,
    });
  } catch (err) {
    console.error("Error en /jefe/dashboard:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/empresas ────────────────────────────────────────────────────
router.get("/empresas", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.nombre AS name, e.sector, e.ciudad, e.estado AS status,
              e.convenio_vencimiento AS convenio, e.contacto_nombre AS contactoNombre,
              e.contacto_email AS contactoEmail, e.contacto_telefono AS contactoTel,
              COUNT(DISTINCT r.id) AS residentes
       FROM empresas e
       LEFT JOIN residentes r ON r.empresa_id = e.id AND r.estado = 'activo'
       GROUP BY e.id ORDER BY e.nombre ASC`,
    );
    return res.json({ ok: true, empresas: rows });
  } catch (err) {
    console.error("Error en GET /jefe/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/empresas ───────────────────────────────────────────────────
router.post("/empresas", ...soloJefe, async (req, res) => {
  const {
    name,
    sector,
    ciudad,
    convenio,
    contactoNombre,
    contactoEmail,
    contactoTel,
    status,
  } = req.body;
  if (!name?.trim())
    return res
      .status(400)
      .json({ ok: false, mensaje: "El nombre es requerido." });
  try {
    const newId = `emp_${Date.now()}`;
    await db.execute(
      `INSERT INTO empresas (id, nombre, sector, ciudad, estado, convenio_vencimiento, contacto_nombre, contacto_email, contacto_telefono)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        newId,
        name.trim(),
        sector || null,
        ciudad || null,
        status || "Nueva",
        convenio || null,
        contactoNombre || null,
        contactoEmail || null,
        contactoTel || null,
      ],
    );
    return res.json({ ok: true, id: newId });
  } catch (err) {
    console.error("Error en POST /jefe/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/empresas/:id ────────────────────────────────────────────────
router.put("/empresas/:id", ...soloJefe, async (req, res) => {
  console.log("===== BODY =====");
  console.log(req.body);

  console.log("===== PARAMS =====");
  console.log(req.params);

  const {
    name,
    sector,
    ciudad,
    convenio,
    contactoNombre,
    contactoEmail,
    contactoTel,
    status,
  } = req.body;

  try {
    console.log("Intentando UPDATE...");

    const result = await db.execute(
      `UPDATE empresas SET nombre=?, sector=?, ciudad=?, estado=?, convenio_vencimiento=?,
      contacto_nombre=?, contacto_email=?, contacto_telefono=? WHERE id=?`,
      [
        name,
        sector || null,
        ciudad || null,
        status || "Activa",
        convenio && convenio.trim() !== "" ? convenio : null,
        contactoNombre || null,
        contactoEmail || null,
        contactoTel || null,
        req.params.id,
      ],
    );
    console.log("UPDATE OK");
    console.log(result);
    return res.json({ ok: true });
  } catch (err) {
    console.log("===== ERROR MYSQL =====");
    console.log(err);

    console.log("MESSAGE:", err.message);
    console.log("CODE:", err.code);

    console.log("SQL MESSAGE:", err.sqlMessage);
    console.log("SQL:", err.sql);

    return res.status(500).json({
      ok: false,
      mensaje: err.message,
      code: err.code,
    });
  }
});

// ── DELETE /api/jefe/empresas/:id ─────────────────────────────────────────────
router.delete("/empresas/:id", ...soloJefe, async (req, res) => {
  try {
    await db.execute("DELETE FROM empresas WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /jefe/empresas/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/proyectos ───────────────────────────────────────────────────
router.get("/proyectos", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.titulo AS title, LOWER(p.estado) AS phase, p.prioridad AS priority,
              p.tecnologias AS tags, e.nombre AS company,
              CONCAT(u.nombre,' ',u.apellidos) AS asesor,
              CONCAT(ur.nombre,' ',ur.apellidos) AS residente,
              CONCAT(LEFT(ur.nombre,1),LEFT(ur.apellidos,1)) AS residenteIniciales,
              COALESCE(p.solicitud_avance, 0) AS solicitud_avance
       FROM proyectos p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN asesores a ON p.asesor_id = a.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN residentes res ON p.residente_id = res.id
       LEFT JOIN usuarios ur ON res.usuario_id = ur.id
       WHERE LOWER(p.estado) IN ('desarrollo','revision','concluido')
       ORDER BY p.created_at DESC`,
    );
    return res.json({ ok: true, proyectos: rows });
  } catch (err) {
    console.error("Error en GET /jefe/proyectos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/proyectos ──────────────────────────────────────────────────
router.post("/proyectos", ...soloJefe, async (req, res) => {
  const {
    titulo,
    empresa_id,
    prioridad,
    estado,
    tecnologias,
    descripcion,
    periodo,
  } = req.body;
  if (!titulo?.trim())
    return res
      .status(400)
      .json({ ok: false, mensaje: "El título del proyecto es requerido." });
  const estadosValidos = ["propuesto", "desarrollo", "revision", "concluido"];
  const prioridadesValidas = ["Alta", "Media", "Baja"];
  const estadoFinal = estadosValidos.includes(estado) ? estado : "desarrollo";
  const prioridadFinal = prioridadesValidas.includes(prioridad)
    ? prioridad
    : "Media";
  try {
    const proyectoId = `p_${Date.now()}`;
    await db.execute(
      `INSERT INTO proyectos (id, titulo, descripcion, empresa_id, periodo, estado, prioridad, tecnologias)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        proyectoId,
        titulo.trim(),
        descripcion || null,
        empresa_id || null,
        periodo || null,
        estadoFinal,
        prioridadFinal,
        tecnologias || null,
      ],
    );
    return res.json({ ok: true, id: proyectoId });
  } catch (err) {
    console.error("Error en POST /jefe/proyectos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/proyectos/:id ───────────────────────────────────────────────
router.put("/proyectos/:id", ...soloJefe, async (req, res) => {
  const { title, priority, tags } = req.body;
  if (!title?.trim())
    return res
      .status(400)
      .json({ ok: false, mensaje: "El título es requerido." });
  const prioridadesValidas = ["Alta", "Media", "Baja"];
  const prioridadFinal = prioridadesValidas.includes(priority)
    ? priority
    : "Media";
  try {
    await db.execute(
      "UPDATE proyectos SET titulo=?, prioridad=?, tecnologias=? WHERE id=?",
      [title.trim(), prioridadFinal, tags || null, req.params.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/proyectos/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/asignacion/datos ────────────────────────────────────────────
router.get("/asignacion/datos", ...soloJefe, async (req, res) => {
  try {
    const [asesores] = await db.execute(
      `SELECT a.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre, a.departamento,
              COUNT(DISTINCT p.id) AS activos
       FROM asesores a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN proyectos p ON p.asesor_id = a.id AND p.estado IN ('desarrollo','revision')
       GROUP BY a.id ORDER BY u.nombre ASC`,
    );
    const [empresas] = await db.execute(
      "SELECT id, nombre FROM empresas WHERE estado != 'Inactiva' ORDER BY nombre ASC",
    );
    const [residentes] = await db.execute(
      `SELECT r.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre,
              r.num_control AS matricula, r.carrera, r.asesor_id
       FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.estado = 'activo' ORDER BY u.nombre ASC`,
    );
    return res.json({ ok: true, asesores, empresas, residentes });
  } catch (err) {
    console.error("Error en GET /jefe/asignacion/datos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// Helper functions para reducir complejidad
const validateAsignacionData = (data) => {
  // BUG FIX: usar let en lugar de const para permitir reasignación de asesorIds
  let { proyectoNombre, empresaId, asesorId, asesorIds, residentesIds } = data;

  if (!asesorIds?.length && asesorId) asesorIds = [asesorId];
  const asesorIdPrimario = asesorIds?.[0];

  if (
    !proyectoNombre?.trim() ||
    !empresaId ||
    !asesorIdPrimario ||
    !residentesIds?.length
  ) {
    throw createError(
      ERROR_CODES.VALIDATION.REQUIRED_FIELD,
      "Faltan datos requeridos.",
    );
  }

  return { asesorIds, asesorIdPrimario };
};

const createProyecto = async (data) => {
  const {
    proyectoNombre,
    empresaId,
    descripcion,
    asesorIdPrimario,
    residentesIds,
    periodo,
  } = data;
  const proyectoId = `p_${Date.now()}`;

  // BUG FIX: había 8 '?' pero solo 7 parámetros; estado y prioridad son literales hardcodeados
  await db.execute(
    `INSERT INTO proyectos (id, titulo, descripcion, empresa_id, asesor_id, residente_id, periodo, estado, prioridad)
     VALUES (?,?,?,?,?,?,?,'propuesto','Media')`,
    [
      proyectoId,
      proyectoNombre.trim(),
      descripcion || null,
      empresaId,
      asesorIdPrimario,
      residentesIds[0],
      periodo || null,
    ],
  );

  return proyectoId;
};

const assignResidentesToAsesor = async (residentesIds, asesorIdPrimario) => {
  for (const rId of residentesIds) {
    await db.execute("UPDATE residentes SET asesor_id = ? WHERE id = ?", [
      asesorIdPrimario,
      rId,
    ]);
  }
};

const assignAsesoresToProyecto = async (proyectoId, asesorIds) => {
  for (const aId of asesorIds) {
    await db.execute(
      "INSERT INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?, ?)",
      [proyectoId, aId],
    );
  }
};

const createReportesForResidentes = async (residentesIds) => {
  const tiposReportes = [
    "preliminar",
    "parcial1",
    "parcial2",
    "parcial3",
    "final",
  ];
  const fechasLimite = [
    "2026-02-28",
    "2026-04-30",
    "2026-06-30",
    "2026-08-30",
    "2026-10-31",
  ];

  for (const rId of residentesIds) {
    for (let i = 0; i < tiposReportes.length; i++) {
      const [existing] = await db.execute(
        "SELECT id FROM reportes WHERE residente_id = ? AND tipo = ?",
        [rId, tiposReportes[i]],
      );
      if (existing.length === 0) {
        await db.execute(
          `INSERT INTO reportes (id, residente_id, tipo, fecha_limite, estado) VALUES (?, ?, ?, ?, 'Pendiente')`,
          [`REP-${rId}-${i + 1}`, rId, tiposReportes[i], fechasLimite[i]],
        );
      }
    }
  }
};

// ── POST /api/jefe/asignacion ─────────────────────────────────────────────────
router.post("/asignacion", ...soloJefe, async (req, res) => {
  try {
    logger.logBusinessOperation("jefe_asignacion_proyecto", req.user.id, {
      endpoint: "/asignacion",
      body: req.body,
    });

    const { asesorIds, asesorIdPrimario } = validateAsignacionData(req.body);
    const proyectoId = await createProyecto({ ...req.body, asesorIdPrimario });

    await assignResidentesToAsesor(req.body.residentesIds, asesorIdPrimario);
    await assignAsesoresToProyecto(proyectoId, asesorIds);
    await createReportesForResidentes(req.body.residentesIds);

    logger.logAudit("ASIGNACION_PROYECTO", req.user.id, proyectoId, {
      asesorIdPrimario,
      residentesCount: req.body.residentesIds.length,
      empresaId: req.body.empresaId,
    });

    return res.json({ ok: true, id: proyectoId });
  } catch (err) {
    logger.logAppError(err, req, { asignacion: true });
    return errorHandler(err, req, res, () => {});
  }
});

// ── POST /api/jefe/proyectos/:id/asesores ────────────────────────────────────
router.post("/proyectos/:id/asesores", ...soloJefe, async (req, res) => {
  const { asesorId } = req.body;
  const proyectoId = req.params.id;
  if (!asesorId)
    return res.status(400).json({ ok: false, mensaje: "asesorId requerido." });
  try {
    const [pRows] = await db.execute(
      "SELECT p.id, p.titulo, u.nombre, u.apellidos FROM proyectos p LEFT JOIN asesores a ON a.id=? LEFT JOIN usuarios u ON u.id=a.usuario_id WHERE p.id=?",
      [asesorId, proyectoId],
    );
    if (!pRows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Proyecto no encontrado." });

    // BUG FIX: también sincronizar tabla proyecto_asesores para que el asesor
    // pueda usar el endpoint /solicitar-avance que verifica dicha tabla.
    await db.execute("UPDATE proyectos SET asesor_id = ? WHERE id = ?", [
      asesorId,
      proyectoId,
    ]);
    await db.execute(
      "INSERT INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE asesor_id = asesor_id",
      [proyectoId, asesorId],
    );

    // Emitir evento en tiempo real para que el Asesor lo vea de inmediato
    const io = req.app.get("io");
    if (io) {
      io.emit("asesor_asignado", {
        proyectoId,
        asesorId,
        titulo: pRows[0].titulo,
        asesorNombre: pRows[0].nombre
          ? `${pRows[0].nombre} ${pRows[0].apellidos}`
          : null,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /jefe/proyectos/:id/asesores:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/proyectos/:id/aprobar-avance ────────────────────────────────
router.put("/proyectos/:id/aprobar-avance", ...soloJefe, async (req, res) => {
  const phases = ["propuesto", "desarrollo", "revision", "concluido"];
  const proyectoId = req.params.id;
  try {
    const [rows] = await db.execute(
      "SELECT estado, solicitud_avance, titulo FROM proyectos WHERE id = ?",
      [proyectoId],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Proyecto no encontrado." });
    const { estado, solicitud_avance, titulo } = rows[0];
    if (!solicitud_avance)
      return res
        .status(400)
        .json({
          ok: false,
          mensaje: "El proyecto no tiene solicitud de avance pendiente.",
        });
    const idx = phases.indexOf(estado);
    if (idx < 0 || idx >= phases.length - 1)
      return res
        .status(400)
        .json({ ok: false, mensaje: "El proyecto ya está en la fase final." });
    const nuevoEstado = phases[idx + 1];
    await db.execute(
      "UPDATE proyectos SET estado = ?, solicitud_avance = 0 WHERE id = ?",
      [nuevoEstado, proyectoId],
    );

    // Emitir en tiempo real: el Asesor verá el cambio de fase sin recargar
    const io = req.app.get("io");
    if (io) {
      io.emit("proyecto_fase_aprobada", {
        proyectoId,
        faseAnterior: estado,
        nuevaFase: nuevoEstado,
        titulo,
      });
    }

    return res.json({ ok: true, nuevoEstado });
  } catch (err) {
    console.error("Error en PUT /jefe/proyectos/:id/aprobar-avance:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/fuentes ─────────────────────────────────────────────────────
router.get("/fuentes", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT f.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre,
              r.carrera, f.tipo AS tipoFuente, f.descripcion AS fuenteDeclarada,
              f.estado, f.observaciones AS motivoRechazo
       FROM fuentes_informacion f
       JOIN residentes r ON f.residente_id = r.id
       JOIN usuarios u ON r.usuario_id = u.id
       ORDER BY f.id ASC`,
    );
    return res.json({ ok: true, fuentes: rows });
  } catch (err) {
    console.error("Error en GET /jefe/fuentes:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/fuentes/:id ─────────────────────────────────────────────────
router.put("/fuentes/:id", ...soloJefe, async (req, res) => {
  const { estado, observaciones } = req.body;
  if (!["Validada", "Rechazada"].includes(estado))
    return res.status(400).json({ ok: false, mensaje: "Estado inválido." });
  try {
    await db.execute(
      "UPDATE fuentes_informacion SET estado=?, revisado_por=?, fecha_revision=CURDATE(), observaciones=? WHERE id=?",
      [estado, req.user.id, observaciones || null, req.params.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/fuentes/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/usuarios-registrados ───────────────────────────────────────
router.get("/usuarios-registrados", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nombre, u.apellidos, u.correo, u.rol, u.created_at AS fecha
       FROM usuarios u WHERE u.rol IN ('residente', 'asesor')
       ORDER BY u.created_at DESC LIMIT 20`,
    );
    const usuarios = rows.map((u) => ({
      id: u.id,
      nombre: `${u.nombre} ${u.apellidos}`,
      correo: u.correo,
      rol: u.rol,
      fecha: new Date(u.fecha).toLocaleDateString("es-MX"),
    }));
    return res.json({ ok: true, usuarios });
  } catch (err) {
    console.error("Error en GET /jefe/usuarios-registrados:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/registrar-usuario ─────────────────────────────────────────
router.post("/registrar-usuario", ...soloJefe, async (req, res) => {
  const {
    rol,
    nombre,
    apellidos,
    correo,
    password,
    numControl,
    carrera,
    semestre,
    departamento,
    numEmpleado,
  } = req.body;

  if (!["residente", "asesor"].includes(rol))
    return res
      .status(400)
      .json({
        ok: false,
        mensaje: "Rol inválido. Debe ser 'residente' o 'asesor'.",
      });
  if (!nombre?.trim() || !apellidos?.trim() || !correo?.trim() || !password)
    return res
      .status(400)
      .json({
        ok: false,
        mensaje: "Nombre, apellidos, correo y contraseña son requeridos.",
      });

  // SEGURIDAD FIX #10: Aumentado mínimo de contraseña de 6 a 8 caracteres
  if (password.length < 8)
    return res
      .status(400)
      .json({
        ok: false,
        mensaje: "La contraseña debe tener al menos 8 caracteres.",
      });

  // Validación básica de formato de correo
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo.trim()))
    return res
      .status(400)
      .json({ ok: false, mensaje: "El formato del correo no es válido." });

  try {
    const [existing] = await db.execute(
      "SELECT id FROM usuarios WHERE correo = ?",
      [correo.trim().toLowerCase()],
    );
    if (existing.length)
      return res
        .status(409)
        .json({ ok: false, mensaje: "Ya existe un usuario con ese correo." });

    const userId = `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const passHash = await bcrypt.hash(password, 10);

    await db.execute(
      `INSERT INTO usuarios (id, nombre, apellidos, correo, password_hash, rol, activo)
       VALUES (?,?,?,?,?,?,1)`,
      [
        userId,
        nombre.trim(),
        apellidos.trim(),
        correo.trim().toLowerCase(),
        passHash,
        rol,
      ],
    );

    if (rol === "residente") {
      const resId = `res_${Date.now()}`;
      await db.execute(
        `INSERT INTO residentes (id, usuario_id, num_control, carrera, semestre) VALUES (?,?,?,?,?)`,
        [
          resId,
          userId,
          numControl?.trim() || null,
          carrera || null,
          semestre || null,
        ],
      );
    } else if (rol === "asesor") {
      const asesorId = `ase_${Date.now()}`;
      await db.execute(
        `INSERT INTO asesores (id, usuario_id, departamento, num_empleado) VALUES (?,?,?,?)`,
        [asesorId, userId, departamento || null, numEmpleado?.trim() || null],
      );
    }

    return res.json({
      ok: true,
      id: userId,
      mensaje: `${rol === "residente" ? "Residente" : "Asesor"} registrado correctamente.`,
    });
  } catch (err) {
    console.error("Error en POST /jefe/registrar-usuario:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno al registrar usuario." });
  }
});

// ── GET /api/jefe/estadisticas-por-periodo ─────────────────────────────────────
router.get("/estadisticas-por-periodo", ...soloJefe, async (req, res) => {
  try {
    const { periodo } = req.query;
    const [periodos] = await db.execute(
      "SELECT DISTINCT periodo FROM proyectos WHERE periodo IS NOT NULL ORDER BY periodo DESC",
    );
    const periodoSeleccionado = periodo || periodos[0]?.periodo;
    if (!periodoSeleccionado)
      return res.json({ ok: true, periodos: [], estadisticas: null });

    const [[{ totalResidentes }]] = await db.execute(
      "SELECT COUNT(DISTINCT p.residente_id) AS totalResidentes FROM proyectos p WHERE p.periodo = ?",
      [periodoSeleccionado],
    );
    const [[{ totalEmpresas }]] = await db.execute(
      "SELECT COUNT(DISTINCT p.empresa_id) AS totalEmpresas FROM proyectos p WHERE p.periodo = ?",
      [periodoSeleccionado],
    );
    const [[{ proyectosActivos }]] = await db.execute(
      "SELECT COUNT(*) AS proyectosActivos FROM proyectos p WHERE p.periodo = ? AND p.estado IN ('desarrollo','revision')",
      [periodoSeleccionado],
    );
    const [empresasPeriodo] = await db.execute(
      `SELECT e.id, e.nombre, COUNT(DISTINCT p.residente_id) AS residentes
       FROM empresas e JOIN proyectos p ON p.empresa_id = e.id AND p.periodo = ?
       GROUP BY e.id ORDER BY residentes DESC`,
      [periodoSeleccionado],
    );
    const [alumnosPorProyecto] = await db.execute(
      `SELECT p.id, p.titulo, COUNT(DISTINCT p.residente_id) AS alumnos
       FROM proyectos p WHERE p.periodo = ? GROUP BY p.id ORDER BY alumnos DESC`,
      [periodoSeleccionado],
    );
    return res.json({
      ok: true,
      periodos,
      periodoSeleccionado,
      estadisticas: { totalResidentes, totalEmpresas, proyectosActivos },
      empresasPeriodo,
      alumnosPorProyecto,
    });
  } catch (err) {
    console.error("Error en GET /jefe/estadisticas-por-periodo:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/porcentaje-cumplimiento ─────────────────────────────────────
router.get("/porcentaje-cumplimiento", ...soloJefe, async (req, res) => {
  try {
    const { periodo } = req.query;
    const [cumplimiento] = await db.execute(
      `SELECT e.id, e.nombre,
              COUNT(DISTINCT r.id) AS total_reportes,
              SUM(CASE WHEN r.estado IN ('Entregado','En Revisión','Aprobado') THEN 1 ELSE 0 END) AS reportes_entregados,
              ROUND(SUM(CASE WHEN r.estado IN ('Entregado','En Revisión','Aprobado') THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT r.id), 0), 2) AS porcentaje_cumplimiento
       FROM empresas e
       LEFT JOIN proyectos p ON p.empresa_id = e.id ${periodo ? "AND p.periodo = ?" : ""}
       LEFT JOIN residentes res ON p.residente_id = res.id
       LEFT JOIN reportes r ON res.id = r.residente_id
       WHERE e.id IN (SELECT DISTINCT empresa_id FROM proyectos ${periodo ? "WHERE periodo = ?" : ""})
       GROUP BY e.id, e.nombre
       ORDER BY porcentaje_cumplimiento DESC`,
      periodo ? [periodo, periodo] : [],
    );
    return res.json({ ok: true, cumplimiento });
  } catch (err) {
    console.error("Error en GET /jefe/porcentaje-cumplimiento:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ─────────────────────────────────────────────
// GRÁFICA DASHBOARD — REPORTES ENTREGADOS
// ─────────────────────────────────────────────
router.get("/grafica-reportes", ...soloJefe, async (_, res) => {
  try {
    // Residentes con al menos un reporte entregado
    const [entregadosRows] = await db.query(`
      SELECT COUNT(DISTINCT residente_id) AS total
      FROM reportes
      WHERE estado IN ('Entregado', 'En Revisión', 'Aprobado')
    `);

    // Total de residentes
    const [residentesRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM residentes
    `);

    const entregados = entregadosRows[0]?.total || 0;
    const totalResidentes = residentesRows[0]?.total || 0;

    const pendientes = totalResidentes - entregados;

    res.json({
      ok: true,
      entregados,
      pendientes,
      totalResidentes,
    });
  } catch (error) {
    console.error("Error obteniendo gráfica:", error);

    res.status(500).json({
      ok: false,
      message: "Error obteniendo datos de gráfica",
    });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN: Residentes ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/residentes", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre, u.correo,
              r.num_control, r.carrera, r.semestre, r.estado,
              CONCAT(ua.nombre,' ',ua.apellidos) AS asesor_nombre
       FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       LEFT JOIN asesores a ON r.asesor_id = a.id
       LEFT JOIN usuarios ua ON a.usuario_id = ua.id
       ORDER BY u.apellidos, u.nombre ASC`,
    );
    return res.json({ ok: true, residentes: rows });
  } catch (err) {
    console.error("Error GET /admin/residentes:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.put("/admin/residentes/:id", ...soloJefe, async (req, res) => {
  const { carrera, semestre, estado } = req.body;
  const estadosValidos = ["activo", "completado", "baja"];
  if (estado && !estadosValidos.includes(estado))
    return res.status(400).json({ ok: false, mensaje: "Estado inválido." });
  try {
    await db.execute(
      "UPDATE residentes SET carrera=?, semestre=?, estado=? WHERE id=?",
      [carrera || null, semestre || null, estado || "activo", req.params.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /admin/residentes/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN: Asesores ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/asesores", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT a.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre, u.correo,
              u.activo, a.departamento, a.num_empleado, a.max_residentes,
              COUNT(DISTINCT p.id) AS proyectos_activos
       FROM asesores a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN proyectos p ON p.asesor_id = a.id AND p.estado IN ('desarrollo','revision')
       GROUP BY a.id ORDER BY u.apellidos, u.nombre ASC`,
    );
    return res.json({ ok: true, asesores: rows });
  } catch (err) {
    console.error("Error GET /admin/asesores:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.put("/admin/asesores/:id", ...soloJefe, async (req, res) => {
  const { departamento, num_empleado, max_residentes } = req.body;
  try {
    await db.execute(
      "UPDATE asesores SET departamento=?, num_empleado=?, max_residentes=? WHERE id=?",
      [departamento || null, num_empleado || null, max_residentes || 10, req.params.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /admin/asesores/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.put("/admin/asesores/:id/toggle", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT u.id AS uid, u.activo FROM asesores a JOIN usuarios u ON a.usuario_id=u.id WHERE a.id=?",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ ok: false, mensaje: "Asesor no encontrado." });
    const nuevoActivo = rows[0].activo ? 0 : 1;
    await db.execute("UPDATE usuarios SET activo=? WHERE id=?", [nuevoActivo, rows[0].uid]);
    return res.json({ ok: true, activo: nuevoActivo });
  } catch (err) {
    console.error("Error PUT /admin/asesores/:id/toggle:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN: Períodos ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

router.get("/periodos", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.nombre, p.fecha_inicio, p.fecha_fin, p.descripcion, p.estado,
              COUNT(DISTINCT ep.empresa_id) AS num_empresas
       FROM periodos p
       LEFT JOIN empresa_periodos ep ON ep.periodo_id = p.id
       GROUP BY p.id ORDER BY p.fecha_inicio DESC`,
    );
    return res.json({ ok: true, periodos: rows });
  } catch (err) {
    console.error("Error GET /periodos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.post("/periodos", ...soloJefe, async (req, res) => {
  const { nombre, fecha_inicio, fecha_fin, descripcion, estado } = req.body;
  if (!nombre?.trim() || !fecha_inicio || !fecha_fin)
    return res.status(400).json({ ok: false, mensaje: "Nombre y fechas son requeridos." });
  try {
    const id = `per_${Date.now()}`;
    await db.execute(
      "INSERT INTO periodos (id, nombre, fecha_inicio, fecha_fin, descripcion, estado) VALUES (?,?,?,?,?,?)",
      [id, nombre.trim(), fecha_inicio, fecha_fin, descripcion || null, estado || "planificado"],
    );
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("Error POST /periodos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.put("/periodos/:id", ...soloJefe, async (req, res) => {
  const { nombre, fecha_inicio, fecha_fin, descripcion, estado } = req.body;
  if (!nombre?.trim() || !fecha_inicio || !fecha_fin)
    return res.status(400).json({ ok: false, mensaje: "Nombre y fechas son requeridos." });
  try {
    await db.execute(
      "UPDATE periodos SET nombre=?, fecha_inicio=?, fecha_fin=?, descripcion=?, estado=? WHERE id=?",
      [nombre.trim(), fecha_inicio, fecha_fin, descripcion || null, estado || "planificado", req.params.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error PUT /periodos/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.delete("/periodos/:id", ...soloJefe, async (req, res) => {
  try {
    const [ep] = await db.execute("SELECT COUNT(*) AS c FROM empresa_periodos WHERE periodo_id=?", [req.params.id]);
    if (ep[0].c > 0)
      return res.status(400).json({ ok: false, mensaje: "El período tiene empresas asociadas. Elimínalas primero." });
    await db.execute("DELETE FROM periodos WHERE id=?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /periodos/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ── ADMIN: Empresas por Período ──────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

router.get("/periodos/:id/empresas", ...soloJefe, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.nombre, e.sector, e.ciudad, e.estado
       FROM empresa_periodos ep
       JOIN empresas e ON ep.empresa_id = e.id
       WHERE ep.periodo_id = ?
       ORDER BY e.nombre ASC`,
      [req.params.id],
    );
    return res.json({ ok: true, empresas: rows });
  } catch (err) {
    console.error("Error GET /periodos/:id/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.post("/periodos/:id/empresas", ...soloJefe, async (req, res) => {
  const { empresa_id } = req.body;
  if (!empresa_id) return res.status(400).json({ ok: false, mensaje: "empresa_id requerido." });
  try {
    await db.execute(
      "INSERT IGNORE INTO empresa_periodos (periodo_id, empresa_id) VALUES (?,?)",
      [req.params.id, empresa_id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error POST /periodos/:id/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

router.delete("/periodos/:id/empresas/:empresaId", ...soloJefe, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM empresa_periodos WHERE periodo_id=? AND empresa_id=?",
      [req.params.id, req.params.empresaId],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error DELETE /periodos/:id/empresas/:eid:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
