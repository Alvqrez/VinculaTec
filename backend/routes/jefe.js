const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "secreto");
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
};

// ── GET /api/jefe/dashboard ───────────────────────────────────────────────────
router.get("/dashboard", auth, async (req, res) => {
  try {
    const [[{ totalResidentes }]] = await db.execute(
      "SELECT COUNT(*) AS totalResidentes FROM residentes WHERE estado = 'activo'"
    );
    const [[{ empresasVinculadas }]] = await db.execute(
      "SELECT COUNT(*) AS empresasVinculadas FROM empresas"
    );
    const [[{ proyectosActivos }]] = await db.execute(
      "SELECT COUNT(*) AS proyectosActivos FROM proyectos WHERE estado IN ('desarrollo','revision')"
    );
    const [[{ reportesPendientes }]] = await db.execute(
      "SELECT COUNT(*) AS reportesPendientes FROM reportes WHERE estado IN ('Pendiente','En Revisión')"
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
       LIMIT 6`
    );

    return res.json({
      ok: true,
      stats: { totalResidentes, empresasVinculadas, proyectosActivos, reportesPendientes },
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
       ORDER BY e.nombre ASC`
    );
    return res.json({ ok: true, empresas: rows });
  } catch (err) {
    console.error("Error en GET /jefe/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/empresas ───────────────────────────────────────────────────
router.post("/empresas", auth, async (req, res) => {
  const { name, sector, ciudad, convenio, contactoNombre, contactoEmail, contactoTel, status } = req.body;
  if (!name?.trim()) return res.status(400).json({ ok: false, mensaje: "El nombre es requerido." });
  try {
    const newId = `emp_${Date.now()}`;
    await db.execute(
      `INSERT INTO empresas (id, nombre, sector, ciudad, estado, convenio_vencimiento, contacto_nombre, contacto_email, contacto_telefono)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [newId, name.trim(), sector || null, ciudad || null, status || "Nueva",
       convenio || null, contactoNombre || null, contactoEmail || null, contactoTel || null]
    );
    return res.json({ ok: true, id: newId });
  } catch (err) {
    console.error("Error en POST /jefe/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/jefe/empresas/:id ────────────────────────────────────────────────
router.put("/empresas/:id", auth, async (req, res) => {
  const { name, sector, ciudad, convenio, contactoNombre, contactoEmail, contactoTel, status } = req.body;
  try {
    await db.execute(
      `UPDATE empresas SET nombre=?, sector=?, ciudad=?, estado=?, convenio_vencimiento=?,
       contacto_nombre=?, contacto_email=?, contacto_telefono=? WHERE id=?`,
      [name, sector || null, ciudad || null, status || "Activa",
       convenio || null, contactoNombre || null, contactoEmail || null, contactoTel || null,
       req.params.id]
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
       ORDER BY p.created_at DESC`
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
    if (title) await db.execute("UPDATE proyectos SET titulo=? WHERE id=?", [title, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/proyectos/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/jefe/asignacion/datos ────────────────────────────────────────────
// Devuelve asesores, empresas y residentes sin proyecto para el wizard
router.get("/asignacion/datos", auth, async (req, res) => {
  try {
    const [asesores] = await db.execute(
      `SELECT a.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre, a.departamento,
              COUNT(p.id) AS activos
       FROM asesores a
       JOIN usuarios u ON a.usuario_id = u.id
       LEFT JOIN proyectos p ON p.asesor_id = a.id AND p.estado IN ('desarrollo','revision')
       GROUP BY a.id
       ORDER BY u.nombre ASC`
    );
    const [empresas] = await db.execute(
      "SELECT id, nombre FROM empresas WHERE estado != 'Inactiva' ORDER BY nombre ASC"
    );
    const [residentes] = await db.execute(
      `SELECT r.id, CONCAT(u.nombre,' ',u.apellidos) AS nombre,
              r.num_control AS matricula, r.carrera
       FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.estado = 'activo' AND r.asesor_id IS NULL
       ORDER BY u.nombre ASC`
    );
    return res.json({ ok: true, asesores, empresas, residentes });
  } catch (err) {
    console.error("Error en GET /jefe/asignacion/datos:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/jefe/asignacion ─────────────────────────────────────────────────
router.post("/asignacion", auth, async (req, res) => {
  const { proyectoNombre, empresaId, descripcion, asesorId, residentesIds } = req.body;
  if (!proyectoNombre?.trim() || !empresaId || !asesorId || !residentesIds?.length)
    return res.status(400).json({ ok: false, mensaje: "Faltan datos requeridos." });

  try {
    const proyectoId = `p_${Date.now()}`;
    // Usar el primer residente como residente_id principal del proyecto
    await db.execute(
      `INSERT INTO proyectos (id, titulo, descripcion, empresa_id, asesor_id, residente_id, estado, prioridad)
       VALUES (?,?,?,?,?,?,'propuesto','Media')`,
      [proyectoId, proyectoNombre.trim(), descripcion || null, empresaId, asesorId, residentesIds[0]]
    );
    // Asignar asesor a todos los residentes
    for (const rId of residentesIds) {
      await db.execute(
        "UPDATE residentes SET asesor_id = ? WHERE id = ?",
        [asesorId, rId]
      );
    }
    return res.json({ ok: true, id: proyectoId });
  } catch (err) {
    console.error("Error en POST /jefe/asignacion:", err);
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
       ORDER BY f.id ASC`
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
      [estado, req.user.id, observaciones || null, req.params.id]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en PUT /jefe/fuentes/:id:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
