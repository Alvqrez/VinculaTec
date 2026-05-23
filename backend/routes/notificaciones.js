const express = require("express");
const db = require("../db");
const { auth, requireRol } = require("../middleware");

const router = express.Router();

// ── GET /api/notificaciones ───────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, tipo, titulo, cuerpo AS body, leida,
              icono AS icon, url_accion AS actionScreen, created_at AS time
       FROM notificaciones
       WHERE usuario_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    const notificaciones = rows.map((n) => ({
      id: n.id,
      icon: n.icon || "bell",
      iconBg: getIconBgColor(n.tipo),
      iconColor: getIconColor(n.tipo),
      title: n.titulo,
      body: n.body || "",
      time: formatTime(n.time),
      unread: !n.leida,
      type: n.tipo,
      typeBg: getIconBgColor(n.tipo),
      typeColor: getIconColor(n.tipo),
      actionScreen: n.actionScreen,
      actionLabel: getActionLabel(n.tipo, n.actionScreen),
    }));

    return res.json({ ok: true, notificaciones });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── POST /api/notificaciones ──────────────────────────────────────────────────
// SEGURIDAD FIX #2: Solo jefes y asesores pueden crear notificaciones para otros usuarios
// Antes: cualquier usuario autenticado podía enviar notificaciones a cualquier usuario_id
router.post("/", auth, requireRol("jefe", "asesor"), async (req, res) => {
  const { usuario_id, tipo, titulo, cuerpo, icono, url_accion } = req.body;

  if (!usuario_id || !tipo || !titulo) {
    return res.status(400).json({
      ok: false,
      mensaje: "usuario_id, tipo y titulo son requeridos.",
    });
  }

  try {
    // Verificar que el destinatario existe en la base de datos
    const [userRows] = await db.execute(
      "SELECT id FROM usuarios WHERE id = ? AND activo = 1",
      [usuario_id],
    );
    if (!userRows.length) {
      return res.status(404).json({ ok: false, mensaje: "El usuario destinatario no existe." });
    }

    const [result] = await db.execute(
      `INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, icono, url_accion, leida)
       VALUES (?,?,?,?,?,?,?)`,
      [usuario_id, tipo, titulo, cuerpo || null, icono || "bell", url_accion || null, false],
    );
    return res.json({ ok: true, id: result.insertId });
  } catch (err) {
    console.error("Error al crear notificación:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/notificaciones/marcar-todas-leidas ───────────────────────────────
router.put("/marcar-todas-leidas", auth, async (req, res) => {
  try {
    await db.execute(
      "UPDATE notificaciones SET leida = true WHERE usuario_id = ?",
      [req.user.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al marcar todas como leídas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/notificaciones/:id ───────────────────────────────────────────────
router.put("/:id", auth, async (req, res) => {
  const { leida } = req.body;
  try {
    await db.execute(
      "UPDATE notificaciones SET leida = ? WHERE id = ? AND usuario_id = ?",
      [leida !== undefined ? leida : true, req.params.id, req.user.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar notificación:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── DELETE /api/notificaciones/todas-leidas ───────────────────────────────────
router.delete("/todas-leidas", auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM notificaciones WHERE usuario_id = ? AND leida = true",
      [req.user.id],
    );
    return res.json({ ok: true, eliminadas: result.affectedRows });
  } catch (err) {
    console.error("Error al eliminar notificaciones leídas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── DELETE /api/notificaciones/:id ────────────────────────────────────────────
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM notificaciones WHERE id = ? AND usuario_id = ?",
      [req.params.id, req.user.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al eliminar notificación:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIconBgColor(tipo) {
  const colors = { Reporte: "#E3F2FD", Aprobación: "#E8F5E9", Cita: "#F3E5F5", Alerta: "#FFF3E0", Mensaje: "#E0F2F1", Logro: "#E8F5E9" };
  return colors[tipo] || "#E3F2FD";
}
function getIconColor(tipo) {
  const colors = { Reporte: "#2196F3", Aprobación: "#4CAF50", Cita: "#9C27B0", Alerta: "#FF9800", Mensaje: "#009688", Logro: "#4CAF50" };
  return colors[tipo] || "#2196F3";
}
function formatTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
function getActionLabel(tipo, actionScreen) {
  if (!actionScreen) return null;
  const labels = { seguimiento: "Ir a Seguimiento", calendario: "Ver calendario", reportes: "Ver reporte" };
  return labels[actionScreen] || "Ver detalles";
}

module.exports = router;
