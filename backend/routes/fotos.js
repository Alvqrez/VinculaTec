const express = require("express");
const db = require("../db");
const { auth, requireRol } = require("../middleware");

const router = express.Router();

// ── GET /api/fotos/:userId ───────────────────────────────────────────────────
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
router.post("/", auth, async (req, res) => {
  const { foto_base64 } = req.body;

  if (!foto_base64) {
    return res.status(400).json({ ok: false, mensaje: "foto_base64 es requerido." });
  }

  if (typeof foto_base64 !== "string" || foto_base64.length > 2000000) {
    return res.status(400).json({ ok: false, mensaje: "La foto es demasiado grande. Máximo 2MB." });
  }

  try {
    const [existing] = await db.execute(
      "SELECT usuario_id FROM fotos_perfil WHERE usuario_id = ?",
      [req.user.id],
    );

    if (existing.length > 0) {
      await db.execute(
        "UPDATE fotos_perfil SET foto_base64 = ?, updated_at = CURRENT_TIMESTAMP WHERE usuario_id = ?",
        [foto_base64, req.user.id],
      );
    } else {
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
