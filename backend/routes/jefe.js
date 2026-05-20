const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    if (!process.env.JWT_SECRET)
      return res.status(500).json({
        ok: false,
        mensaje: "JWT_SECRET no está configurado en el servidor.",
      });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
};

// ── GET /api/jefe/dashboard ───────────────────────────────────────────────────
router.get("/dashboard", auth, async (req, res) => {
  try {
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

    // Top empresas con más residentes
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
router.get("/empresas", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.id, e.nombre AS name, e.sector, e.ciudad, e.estado AS status,
              e.convenio_vencimiento AS convenio,
              e.contacto_nombre AS contactoNombre,
              e.contacto_email AS contactoEmail,
              e.contacto_telefono AS contactoTel,
              COUNT(DISTINCT r.id) AS residentes
       FROM empresas e
       LEFT JOIN residentes r ON r.empresa_id = e.id AND r.estado = 'activo'
       GROUP BY e.id
       ORDER BY e.nombre ASC`,
    );
    return res.json({ ok: true, empresas: rows });
  } catch (err) {
    console.error("Error en GET /jefe/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/empresas ───────────────────────────────────────────────────
router.post("/empresas", auth, async (req, res) => {
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
router.put("/empresas/:id", auth, async (req, res) => {
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
    await db.execute(
      `UPDATE empresas SET nombre=?, sector=?, ciudad=?, estado=?, convenio_vencimiento=?,
       contacto_nombre=?, contacto_email=?, contacto_telefono=? WHERE id=?`,
      [
        name,
        sector || null,
        ciudad || null,
        status || "Activa",
        convenio || null,
        contactoNombre || null,
        contactoEmail || null,
        contactoTel || null,
        req.params.id,
      ],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/empresas/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── DELETE /api/jefe/empresas/:id ─────────────────────────────────────────────
router.delete("/empresas/:id", auth, async (req, res) => {
  try {
    await db.execute("DELETE FROM empresas WHERE id = ?", [req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en DELETE /jefe/empresas/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/proyectos ───────────────────────────────────────────────────
router.get("/proyectos", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT p.id, p.titulo AS title, p.estado AS phase, p.prioridad AS priority,
              p.tecnologias AS tags,
              e.nombre AS company,
              CONCAT(u.nombre,' ',u.apellidos) AS asesor,
              CONCAT(ur.nombre,' ',ur.apellidos) AS residente,
              CONCAT(LEFT(ur.nombre,1),LEFT(ur.apellidos,1)) AS residenteIniciales
       FROM proyectos p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN asesores a ON p.asesor_id = a.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN residentes res ON p.residente_id = res.id
       LEFT JOIN usuarios ur ON res.usuario_id = ur.id
       WHERE p.estado IN ('desarrollo','revision','concluido')
       ORDER BY p.created_at DESC`,
    );
    return res.json({ ok: true, proyectos: rows });
  } catch (err) {
    console.error("Error en GET /jefe/proyectos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/proyectos/:id ───────────────────────────────────────────────
router.put("/proyectos/:id", auth, async (req, res) => {
  const { title, asesorNombre } = req.body;
  try {
    if (title)
      await db.execute("UPDATE proyectos SET titulo=? WHERE id=?", [
        title,
        req.params.id,
      ]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/proyectos/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/asignacion/datos ────────────────────────────────────────────
// Devuelve asesores, empresas y residentes sin asesor para el wizard de asignación
router.get("/asignacion/datos", auth, async (req, res) => {
  try {
    // Contar proyectos activos por asesor usando la tabla junction
    const [asesores] = await db.execute(
      `SELECT a.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre, a.departamento,
              COUNT(DISTINCT pa.proyecto_id) AS activos
       FROM asesores a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN proyecto_asesores pa ON pa.asesor_id = a.id
       LEFT JOIN proyectos p ON p.id = pa.proyecto_id AND p.estado IN ('desarrollo','revision')
       GROUP BY a.id
       ORDER BY u.nombre ASC`,
    );
    const [empresas] = await db.execute(
      "SELECT id, nombre FROM empresas WHERE estado != 'Inactiva' ORDER BY nombre ASC",
    );
    // Residentes activos sin asesor asignado (disponibles para nueva asignación)
    const [residentes] = await db.execute(
      `SELECT r.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre,
              r.num_control AS matricula, r.carrera
       FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.estado = 'activo' AND r.asesor_id IS NULL
       ORDER BY u.nombre ASC`,
    );
    return res.json({ ok: true, asesores, empresas, residentes });
  } catch (err) {
    console.error("Error en GET /jefe/asignacion/datos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/asignacion ─────────────────────────────────────────────────
// Crea un proyecto y lo asigna a uno o varios asesores y a los residentes indicados.
// Regla: cada residente tiene UN SOLO asesor (el primero de asesorIds).
// Todos los asesorIds quedan vinculados al proyecto en proyecto_asesores.
router.post("/asignacion", auth, async (req, res) => {
  // Soporta tanto asesorId (legacy, string) como asesorIds (array)
  let {
    proyectoNombre,
    empresaId,
    descripcion,
    asesorId,
    asesorIds,
    residentesIds,
  } = req.body;

  // Normalizar a array
  if (!asesorIds?.length && asesorId) asesorIds = [asesorId];
  const asesorIdPrimario = asesorIds?.[0];

  if (
    !proyectoNombre?.trim() ||
    !empresaId ||
    !asesorIdPrimario ||
    !residentesIds?.length
  )
    return res
      .status(400)
      .json({ ok: false, mensaje: "Faltan datos requeridos." });

  try {
    const proyectoId = `p_${Date.now()}`;

    // Insertar proyecto con el asesor principal como referencia rápida
    await db.execute(
      `INSERT INTO proyectos (id, titulo, descripcion, empresa_id, asesor_id, residente_id, estado, prioridad)
       VALUES (?,?,?,?,?,?,'propuesto','Media')`,
      [
        proyectoId,
        proyectoNombre.trim(),
        descripcion || null,
        empresaId,
        asesorIdPrimario,
        residentesIds[0],
      ],
    );

    // Vincular TODOS los asesores en proyecto_asesores
    for (const aId of asesorIds) {
      await db.execute(
        "INSERT IGNORE INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?, ?)",
        [proyectoId, aId],
      );
    }

    // Asignar el asesor PRINCIPAL a todos los residentes seleccionados
    for (const rId of residentesIds) {
      await db.execute("UPDATE residentes SET asesor_id = ? WHERE id = ?", [
        asesorIdPrimario,
        rId,
      ]);
    }

    return res.json({ ok: true, id: proyectoId });
  } catch (err) {
    console.error("Error en POST /jefe/asignacion:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/proyectos/:id/asesores ────────────────────────────────────
// Agrega un asesor adicional a un proyecto existente
router.post("/proyectos/:id/asesores", auth, async (req, res) => {
  const { asesorId } = req.body;
  if (!asesorId)
    return res.status(400).json({ ok: false, mensaje: "asesorId requerido." });
  try {
    // Verificar que el proyecto existe
    const [pRows] = await db.execute("SELECT id FROM proyectos WHERE id = ?", [
      req.params.id,
    ]);
    if (!pRows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Proyecto no encontrado." });

    await db.execute(
      "INSERT IGNORE INTO proyecto_asesores (proyecto_id, asesor_id) VALUES (?, ?)",
      [req.params.id, asesorId],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /jefe/proyectos/:id/asesores:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/proyectos/:id/aprobar-avance ────────────────────────────────
// Aprueba la solicitud de avance de fase de un proyecto
router.put("/proyectos/:id/aprobar-avance", auth, async (req, res) => {
  const phases = ["propuesto", "desarrollo", "revision", "concluido"];
  try {
    const [rows] = await db.execute(
      "SELECT estado, solicitud_avance FROM proyectos WHERE id = ?",
      [req.params.id],
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Proyecto no encontrado." });

    const { estado, solicitud_avance } = rows[0];
    if (!solicitud_avance)
      return res.status(400).json({
        ok: false,
        mensaje: "El proyecto no tiene una solicitud de avance pendiente.",
      });

    const idx = phases.indexOf(estado);
    if (idx < 0 || idx >= phases.length - 1)
      return res
        .status(400)
        .json({ ok: false, mensaje: "El proyecto ya está en la fase final." });

    const nuevoEstado = phases[idx + 1];
    await db.execute(
      "UPDATE proyectos SET estado = ?, solicitud_avance = 0 WHERE id = ?",
      [nuevoEstado, req.params.id],
    );
    return res.json({ ok: true, nuevoEstado });
  } catch (err) {
    console.error("Error en PUT /jefe/proyectos/:id/aprobar-avance:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/fuentes ─────────────────────────────────────────────────────
router.get("/fuentes", auth, async (req, res) => {
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
router.put("/fuentes/:id", auth, async (req, res) => {
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
// Lista los usuarios registrados por el jefe (residentes y asesores) más recientes
router.get("/usuarios-registrados", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.id, u.nombre, u.apellidos, u.correo, u.rol, u.created_at AS fecha
       FROM usuarios u
       WHERE u.rol IN ('residente', 'asesor')
       ORDER BY u.created_at DESC
       LIMIT 20`,
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
// Crea un nuevo usuario (residente o asesor) con sus datos de perfil
router.post("/registrar-usuario", auth, async (req, res) => {
  const bcrypt = require("bcryptjs");
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
  if (password.length < 6)
    return res
      .status(400)
      .json({
        ok: false,
        mensaje: "La contraseña debe tener al menos 6 caracteres.",
      });

  try {
    // Verificar que el correo no esté registrado
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

    // Insertar en usuarios
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
        `INSERT INTO residentes (id, usuario_id, num_control, carrera, semestre)
         VALUES (?,?,?,?,?)`,
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
        `INSERT INTO asesores (id, usuario_id, departamento, num_empleado)
         VALUES (?,?,?,?)`,
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

module.exports = router;
