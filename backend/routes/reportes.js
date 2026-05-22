const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// ── Middleware de autenticación ───────────────────────────────────────────────
function auth(req, res, next) {
  const a = req.headers.authorization;
  if (!a) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    req.usuario = jwt.verify(
      a.split(" ")[1],
      process.env.JWT_SECRET || "secreto",
    );
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
}

// Mapa frontend → ENUM de la BD
const TIPO_ENUM = {
  preliminar: "preliminar",
  Preliminar: "preliminar",
  1: "parcial1",
  2: "parcial2",
  3: "parcial3",
  parcial1: "parcial1",
  parcial2: "parcial2",
  parcial3: "parcial3",
  final: "final",
  Final: "final",
};

// ── POST /api/reportes/submit ─────────────────────────────────────────────────
// El residente envía (o reenvía) un reporte
router.post("/submit", auth, async (req, res) => {
  const { tipo, nombreArchivo } = req.body;
  const userId = req.usuario.id;

  if (!tipo)
    return res
      .status(400)
      .json({ ok: false, mensaje: "Falta el tipo de reporte." });

  const tipoEnum = TIPO_ENUM[tipo];
  if (!tipoEnum)
    return res
      .status(400)
      .json({ ok: false, mensaje: "Tipo de reporte no válido." });

  try {
    // Obtener el residente vinculado a este usuario
    const [resRows] = await db.execute(
      "SELECT id FROM residentes WHERE usuario_id = ?",
      [userId],
    );
    if (!resRows.length)
      return res
        .status(404)
        .json({
          ok: false,
          mensaje: "No se encontró un residente para este usuario.",
        });

    const residenteId = resRows[0].id;
    const today = new Date().toISOString().split("T")[0];

    // Verificar si ya existe un reporte de este tipo
    const [existing] = await db.execute(
      "SELECT id, estado FROM reportes WHERE residente_id = ? AND tipo = ?",
      [residenteId, tipoEnum],
    );

    if (existing.length > 0) {
      const rep = existing[0];
      // Si está "Rechazado" (Por corregir), se permite reenviar
      if (rep.estado === "Rechazado" || rep.estado === "Por corregir") {
        await db.execute(
          "UPDATE reportes SET estado = 'En Revisión', fecha_entrega = ?, archivo = ? WHERE id = ?",
          [today, nombreArchivo || null, rep.id],
        );
        return res.json({
          ok: true,
          mensaje: "Reporte reenviado para revisión.",
          reenvio: true,
        });
      }
      // Si ya está en revisión o aprobado, no se puede duplicar
      return res.status(409).json({
        ok: false,
        mensaje: `Este reporte ya fue enviado (estado: ${rep.estado}).`,
      });
    }

    // Crear nuevo registro de reporte
    await db.execute(
      `INSERT INTO reportes (residente_id, tipo, estado, fecha_entrega, archivo)
       VALUES (?, ?, 'En Revisión', ?, ?)`,
      [residenteId, tipoEnum, today, nombreArchivo || null],
    );

    return res.json({
      ok: true,
      mensaje:
        "Reporte enviado correctamente. El asesor recibirá una notificación.",
    });
  } catch (err) {
    console.error("Error al guardar reporte:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

// ── DELETE /api/reportes/undo ─────────────────────────────────────────────────
// Deshace el último envío (solo si el estado es "En Revisión" y fue hoy)
router.delete("/undo", auth, async (req, res) => {
  const { tipo } = req.body;
  const userId = req.usuario.id;

  if (!tipo)
    return res
      .status(400)
      .json({ ok: false, mensaje: "Falta el tipo de reporte." });

  const tipoEnum = TIPO_ENUM[tipo];
  if (!tipoEnum)
    return res.status(400).json({ ok: false, mensaje: "Tipo no válido." });

  try {
    const [resRows] = await db.execute(
      "SELECT id FROM residentes WHERE usuario_id = ?",
      [userId],
    );
    if (!resRows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Residente no encontrado." });

    const residenteId = resRows[0].id;
    const today = new Date().toISOString().split("T")[0];

    // Solo permite deshacer si fue enviado hoy y está "En Revisión"
    const [rows] = await db.execute(
      `SELECT id FROM reportes
       WHERE residente_id = ? AND tipo = ? AND estado = 'En Revisión'
         AND DATE(fecha_entrega) = ?`,
      [residenteId, tipoEnum, today],
    );

    if (!rows.length)
      return res.status(404).json({
        ok: false,
        mensaje: "No hay un envío reciente que pueda deshacerse.",
      });

    await db.execute("DELETE FROM reportes WHERE id = ?", [rows[0].id]);

    return res.json({ ok: true, mensaje: "Envío deshecho correctamente." });
  } catch (err) {
    console.error("Error al deshacer reporte:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/reportes/residente ───────────────────────────────────────────────
// El residente obtiene sus propios reportes
router.get("/residente", auth, async (req, res) => {
  const userId = req.usuario.id;

  try {
    const [resRows] = await db.execute(
      "SELECT id FROM residentes WHERE usuario_id = ?",
      [userId],
    );
    if (!resRows.length)
      return res
        .status(404)
        .json({ ok: false, mensaje: "Residente no encontrado." });

    const residenteId = resRows[0].id;

    const [reportes] = await db.execute(
      `SELECT id, tipo, estado, fecha_entrega, archivo, feedback
       FROM reportes
       WHERE residente_id = ?
       ORDER BY FIELD(tipo, 'preliminar','parcial1','parcial2','parcial3','final')`,
      [residenteId],
    );

    // Normalizar al formato que espera el frontend
    const ESTADO_MAP = {
      Aprobado: "Aceptado",
      "En Revisión": "Pendiente",
      Entregado: "Pendiente",
      Pendiente: "Pendiente",
      Rechazado: "Por corregir",
    };
    const TIPO_MAP = {
      preliminar: "preliminar",
      parcial1: 1,
      parcial2: 2,
      parcial3: 3,
      final: "final",
    };

    const data = reportes.map((r) => ({
      id: TIPO_MAP[r.tipo] ?? r.tipo,
      tipo: r.tipo,
      status: ESTADO_MAP[r.estado] || r.estado,
      submitted: r.fecha_entrega
        ? new Date(r.fecha_entrega).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
      feedback: r.feedback,
      archivo: r.archivo,
    }));

    return res.json({ ok: true, reportes: data });
  } catch (err) {
    console.error("Error al obtener reportes:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
