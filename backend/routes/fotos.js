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

// ── GET /api/fotos/:userId ───────────────────────────────────────────────────
// Obtiene la foto de perfil de un usuario específico
router.get("/:userId", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT foto_base64 FROM fotos_perfil WHERE usuario_id = ?",
      [req.params.userId],
    );

    if (rows.length === 0) {
      return res.json({ ok: true, foto: null });
    }

    return res.json({ ok: true, foto: rows[0].foto_base64 });
  } catch (err) {
    console.error("Error al obtener foto:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/fotos ───────────────────────────────────────────────────────────
// Guarda o actualiza la foto de perfil del usuario autenticado
router.post("/", auth, async (req, res) => {
  const { foto_base64 } = req.body;

  if (!foto_base64) {
    return res.status(400).json({ ok: false, mensaje: "foto_base64 es requerido." });
  }

  // Validar que el string base64 sea válido y no sea demasiado grande
  if (typeof foto_base64 !== "string" || foto_base64.length > 5000000) {
    return res.status(400).json({ ok: false, mensaje: "foto_base64 inválido o demasiado grande." });
  }

  try {
    // Verificar si ya existe una foto para este usuario
    const [existing] = await db.execute(
      "SELECT usuario_id FROM fotos_perfil WHERE usuario_id = ?",
      [req.user.id],
    );

    if (existing.length > 0) {
      // Actualizar foto existente
      await db.execute(
        "UPDATE fotos_perfil SET foto_base64 = ?, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?",
        [foto_base64, req.user.id],
      );
    } else {
      // Insertar nueva foto
      await db.execute(
        "INSERT INTO fotos_perfil (usuario_id, foto_base64) VALUES (?, ?)",
        [req.user.id, foto_base64],
      );
    }

    return res.json({ ok: true, mensaje: "Foto guardada exitosamente." });
  } catch (err) {
    console.error("Error al guardar foto:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── DELETE /api/fotos ────────────────────────────────────────────────────────
// Elimina la foto de perfil del usuario autenticado
router.delete("/", auth, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM fotos_perfil WHERE usuario_id = ?",
      [req.user.id],
    );
    return res.json({ ok: true, mensaje: "Foto eliminada exitosamente." });
  } catch (err) {
    console.error("Error al eliminar foto:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
