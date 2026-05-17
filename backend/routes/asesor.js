
//Comprobacion de cambios en GitHub

const express = require("express");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

const router = express.Router();

// ── Middleware: verificar JWT ─────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET || "secreto");
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
}

// ── GET /api/asesor/dashboard ─────────────────────────────────────────────────
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [userId],
    );
    if (!asesorRows.length)
      return res.status(403).json({ ok: false, mensaje: "El usuario no es asesor." });

    const asesorId = asesorRows[0].id;

    // Residentes activos asignados a este asesor
    const [resRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM residentes WHERE asesor_id = ? AND estado = 'activo'",
      [asesorId],
    );

    // Proyectos activos (en desarrollo o revisión)
    const [projRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM proyectos WHERE asesor_id = ? AND estado IN ('desarrollo','revision')",
      [asesorId],
    );

    // Reportes pendientes de residentes de este asesor
    const [repRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM reportes r
       JOIN residentes res ON r.residente_id = res.id
       WHERE res.asesor_id = ? AND r.estado IN ('Pendiente','En Revisión')`,
      [asesorId],
    );

    // Próximas citas del asesor
    const [citaRows] = await db.execute(
      `SELECT c.id, c.tipo, c.motivo, c.fecha_hora, c.lugar, c.estado,
              u.nombre, u.apellidos
       FROM citas c
       JOIN usuarios u ON c.solicitante_id = u.id
       WHERE c.participante_id = ?
         AND c.estado != 'Cancelada'
         AND c.fecha_hora >= NOW()
       ORDER BY c.fecha_hora ASC
       LIMIT 5`,
      [userId],
    );

    return res.json({
      ok: true,
      data: {
        totalResidentes:    resRows[0].total,
        proyectosActivos:   projRows[0].total,
        reportesPendientes: repRows[0].total,
        proximasCitas:      citaRows,
      },
    });
  } catch (err) {
    console.error("Error en /asesor/dashboard:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

module.exports = router;
