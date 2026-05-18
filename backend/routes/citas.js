const express = require("express");
const jwt     = require("jsonwebtoken");
const db      = require("../db");

const router = express.Router();

// ── Middleware de autenticación ───────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, mensaje: "JWT_SECRET no está configurado en el servidor." });
    }
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
};

// ── POST /api/citas ───────────────────────────────────────────────────────────
// Body: { participante_id?, tipo?, motivo?, notas?, fecha_hora, lugar? }
router.post("/", auth, async (req, res) => {
  const { participante_id, tipo, motivo, notas, fecha_hora, lugar } = req.body;

  if (!fecha_hora)
    return res.status(400).json({ ok: false, mensaje: "fecha_hora es requerida." });

  try {
    const [result] = await db.execute(
      `INSERT INTO citas
         (solicitante_id, participante_id, tipo, motivo, notas, fecha_hora, lugar, estado)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        participante_id || req.user.id,
        tipo            || "Otro",
        motivo          || null,
        notas           || null,
        fecha_hora,
        lugar           || null,
        "Pendiente",
      ],
    );
    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("Error al guardar cita:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/citas/mis-citas ──────────────────────────────────────────────────
router.get("/mis-citas", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT c.*,
          u1.nombre AS solicitante_nombre,
          u2.nombre AS participante_nombre
        FROM citas c
        LEFT JOIN usuarios u1 ON u1.id = c.solicitante_id
        LEFT JOIN usuarios u2 ON u2.id = c.participante_id
        WHERE c.solicitante_id = ? OR c.participante_id = ?
        ORDER BY c.fecha_hora ASC`,
      [req.user.id, req.user.id],
    );
    return res.json({ ok: true, citas: rows });
  } catch (err) {
    console.error("Error al obtener citas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PATCH /api/citas/:id ──────────────────────────────────────────────────────
// Body: { estado }  → "Confirmada" | "Cancelada"
router.patch("/:id", auth, async (req, res) => {
  const { estado } = req.body;
  if (!["Confirmada", "Cancelada", "Pendiente"].includes(estado))
    return res.status(400).json({ ok: false, mensaje: "Estado inválido." });
  try {
    await db.execute("UPDATE citas SET estado=? WHERE id=?", [estado, req.params.id]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar cita:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
