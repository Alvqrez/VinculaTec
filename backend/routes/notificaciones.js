const express = require("express");
const crypto = require("crypto");
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

// ── GET /api/notificaciones ───────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, tipo_notificacion, titulo, mensaje, is_read,
              icon, icon_color, icon_bg, proyecto_id, fase, 
              action_screen, action_label, metadata, created_at
       FROM notificaciones_activas
       WHERE usuario_id = ?
       ORDER BY created_at DESC`,
      [req.user.id],
    );

    const notificaciones = rows.map((n) => ({
      id: n.id,
      icon: n.icon || "bell",
      iconBg: n.icon_bg || "#F3F4F6",
      iconColor: n.icon_color || "#6B7280",
      title: n.titulo,
      body: n.mensaje || "",
      time: formatTime(n.created_at),
      unread: !n.is_read,
      type: n.tipo_notificacion,
      typeBg: n.icon_bg || "#F3F4F6",
      typeColor: n.icon_color || "#6B7280",
      proyecto: n.proyecto_id,
      fase: n.fase,
      actionScreen: n.action_screen,
      actionLabel: n.action_label,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));

    return res.json({ ok: true, notificaciones });
  } catch (err) {
    console.error("Error al obtener notificaciones:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/asesor/notificaciones ─────────────────────────────────────────────
// Endpoint específico para el Asesor: obtiene notificaciones enviadas a sus residentes
router.get(
  "/asesor/notificaciones",
  auth,
  requireRol("asesor"),
  async (req, res) => {
    try {
      // Obtener asesor_id del usuario autenticado
      const [asesorRows] = await db.execute(
        "SELECT id FROM asesores WHERE usuario_id = ?",
        [req.user.id],
      );
      if (!asesorRows.length) {
        return res
          .status(403)
          .json({ ok: false, mensaje: "El usuario no es asesor." });
      }
      const asesorId = asesorRows[0].id;

      // Obtener notificaciones enviadas a residentes de este asesor
      const [rows] = await db.execute(
        `SELECT n.id, n.tipo_notificacion, n.titulo, n.mensaje, n.is_read,
              n.icon, n.icon_color, n.icon_bg, n.proyecto_id, n.fase, 
              n.action_screen, n.action_label, n.metadata, n.created_at,
              u.nombre as residente_nombre, u.apellidos as residente_apellidos
       FROM notificaciones_activas n
       JOIN usuarios u ON n.usuario_id = u.id
       JOIN residentes r ON u.id = r.usuario_id
       WHERE r.asesor_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
        [asesorId],
      );

      const notificaciones = rows.map((n) => ({
        id: n.id,
        icon: n.icon || "bell",
        iconBg: n.icon_bg || "#F3F4F6",
        iconColor: n.icon_color || "#6B7280",
        title: n.titulo,
        body: n.mensaje || "",
        time: formatTime(n.created_at),
        unread: !n.is_read,
        type: n.tipo_notificacion,
        typeBg: n.icon_bg || "#F3F4F6",
        typeColor: n.icon_color || "#6B7280",
        proyecto: n.proyecto_id,
        fase: n.fase,
        actionScreen: n.action_screen,
        actionLabel: n.action_label,
        residente: `${n.residente_nombre} ${n.residente_apellidos}`,
        metadata: n.metadata ? JSON.parse(n.metadata) : null,
      }));

      return res.json({ ok: true, notificaciones });
    } catch (err) {
      console.error("Error al obtener notificaciones del asesor:", err);
      return res.status(500).json({ ok: false, mensaje: "Error interno." });
    }
  },
);

// ── GET /api/asesor/residentes ─────────────────────────────────────────────────
// Obtener residentes del asesor con paginación y datos completos
router.get(
  "/asesor/residentes",
  auth,
  requireRol("asesor"),
  async (req, res) => {
    try {
      // Parsear parámetros de paginación
      const page = Math.max(1, Number.parseInt(req.query.page) || 1);
      const limit = Math.min(
        50,
        Math.max(1, Number.parseInt(req.query.limit) || 20),
      );
      const offset = (page - 1) * limit;

      // Obtener asesor_id del usuario autenticado
      const [asesorRows] = await db.execute(
        "SELECT id FROM asesores WHERE usuario_id = ?",
        [req.user.id],
      );
      if (!asesorRows.length) {
        return res
          .status(403)
          .json({ ok: false, mensaje: "El usuario no es asesor." });
      }
      const asesorId = asesorRows[0].id;

      // Obtener total de residentes para paginación
      const [countRows] = await db.execute(
        `SELECT COUNT(*) as total 
       FROM residentes r 
       JOIN usuarios u ON r.usuario_id = u.id 
       WHERE r.asesor_id = ? AND u.activo = 1`,
        [asesorId],
      );
      const total = countRows[0].total;

      // Obtener residentes con paginación
      const [residenteRows] = await db.execute(
        `SELECT 
        u.id as usuario_id,
        u.nombre,
        u.apellidos,
        u.email,
        u.matricula,
        r.id as residente_id,
        r.estado as estado_residente,
        r.fecha_inicio,
        p.titulo as proyecto_actual,
        p.fase as fase_proyecto,
        p.estado as estado_proyecto
       FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       LEFT JOIN proyectos p ON p.id = r.proyecto_actual_id
       WHERE r.asesor_id = ? AND u.activo = 1
       ORDER BY u.apellidos, u.nombre
       LIMIT ? OFFSET ?`,
        [asesorId, limit, offset],
      );

      const residentes = residenteRows.map((r) => ({
        usuario_id: r.usuario_id,
        residente_id: r.residente_id,
        nombre: r.nombre,
        apellidos: r.apellidos,
        nombre_completo: `${r.nombre} ${r.apellidos}`,
        email: r.email,
        matricula: r.matricula,
        estado: r.estado_residente,
        fecha_inicio: r.fecha_inicio,
        proyecto_actual: r.proyecto_actual
          ? {
              titulo: r.proyecto_actual,
              fase: r.fase,
              estado: r.estado_proyecto,
            }
          : null,
      }));

      // Calcular información de paginación
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return res.json({
        ok: true,
        data: residentes,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit,
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          next_page: hasNextPage ? page + 1 : null,
          prev_page: hasPrevPage ? page - 1 : null,
        },
      });
    } catch (err) {
      console.error("Error al obtener residentes del asesor:", err);
      return res
        .status(500)
        .json({ ok: false, mensaje: "Error interno del servidor." });
    }
  },
);

// ── POST /api/notificaciones ──────────────────────────────────────────────────
// Crear notificaciones persistentes con el nuevo esquema
router.post(
  "/",
  auth,
  requireRol("jefe", "asesor"),
  validateRequest(schemas.createNotification),
  async (req, res) => {
    const {
      usuario_id,
      tipo_notificacion,
      titulo,
      mensaje,
      icon = "bell",
      icon_color = "#6B7280",
      icon_bg = "#F3F4F6",
      proyecto_id = null,
      fase = null,
      action_screen = null,
      action_label = null,
      metadata = null,
    } = req.body;

    // Validaciones
    if (!usuario_id || !tipo_notificacion || !titulo || !mensaje) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "usuario_id, tipo_notificacion, titulo y mensaje son requeridos.",
      });
    }

    if (!["REVISION", "AVANCE", "SISTEMA"].includes(tipo_notificacion)) {
      return res.status(400).json({
        ok: false,
        mensaje: "tipo_notificacion debe ser: REVISION, AVANCE o SISTEMA",
      });
    }

    try {
      // Verificar que el destinatario existe
      const [userRows] = await db.execute(
        "SELECT id FROM usuarios WHERE id = ? AND activo = 1",
        [usuario_id],
      );
      if (!userRows.length) {
        return res
          .status(404)
          .json({ ok: false, mensaje: "El usuario destinatario no existe." });
      }

      // Si se especifica proyecto_id, verificar que existe
      if (proyecto_id) {
        const [projRows] = await db.execute(
          "SELECT id FROM proyectos WHERE id = ?",
          [proyecto_id],
        );
        if (!projRows.length) {
          return res
            .status(400)
            .json({
              ok: false,
              mensaje: "El proyecto especificado no existe.",
            });
        }
      }

      const metadataJson = metadata ? JSON.stringify(metadata) : null;
      const notifId = crypto.randomUUID();

      // Insertar en notificaciones_activas (tabla que el GET lee)
      const [result] = await db.execute(
        `INSERT INTO notificaciones_activas
       (id, usuario_id, tipo_notificacion, titulo, mensaje, icon, icon_color, icon_bg,
        proyecto_id, fase, action_screen, action_label, metadata, is_read)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          notifId,
          usuario_id,
          tipo_notificacion,
          titulo,
          mensaje,
          icon,
          icon_color,
          icon_bg,
          proyecto_id,
          fase,
          action_screen,
          action_label,
          metadataJson,
          false,
        ],
      );

      // Emitir evento WebSocket para notificación en tiempo real
      const io = req.app.get("io");
      if (io) {
        io.to(`user_${usuario_id}`).emit("notificacion_nueva", {
          id: notifId,
          tipo_notificacion,
          titulo,
          mensaje,
          icon,
          icon_color,
          icon_bg,
          action_screen,
          action_label,
          created_at: new Date().toISOString(),
        });
      }

      return res.json({ ok: true, id: notifId });
    } catch (err) {
      console.error("Error al crear notificación:", err);
      return res.status(500).json({ ok: false, mensaje: "Error interno." });
    }
  },
);

// ── PUT /api/notificaciones/marcar-todas-leidas ───────────────────────────────
router.put("/marcar-todas-leidas", auth, async (req, res) => {
  try {
    await db.execute(
      "UPDATE notificaciones SET is_read = true WHERE usuario_id = ? AND deleted_at IS NULL",
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
  const { is_read } = req.body;
  try {
    await db.execute(
      "UPDATE notificaciones SET is_read = ? WHERE id = ? AND usuario_id = ? AND deleted_at IS NULL",
      [is_read !== undefined ? is_read : true, req.params.id, req.user.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al actualizar notificación:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/notificaciones/:id/read ───────────────────────────────────────────
// Marcar notificación específica como leída con validación completa
router.put(
  "/:id/read",
  auth,
  validateRequest(schemas.markNotificationRead),
  async (req, res) => {
    const notificationId = Number.parseInt(req.params.id);

    try {
      // Verificar que la notificación existe y pertenece al usuario
      const [existingRows] = await db.execute(
        `SELECT id, is_read, tipo_notificacion, titulo 
       FROM notificaciones_activas 
       WHERE id = ? AND usuario_id = ?`,
        [notificationId, req.user.id],
      );

      if (existingRows.length === 0) {
        logger.warn("Notification not found for user", {
          notificationId,
          userId: req.user.id,
          action: "mark_read",
        });
        throw createError(ERROR_CODES.BUSINESS.NOTIFICATION_NOT_FOUND);
      }

      const notification = existingRows[0];

      // Si ya está leída, devolver estado actual
      if (notification.is_read) {
        logger.info("Notification already read", {
          notificationId,
          userId: req.user.id,
        });
        return res.json({
          ok: true,
          data: { ...notification, is_read: true },
          mensaje: "La notificación ya estaba marcada como leída.",
        });
      }

      // Actualizar estado
      await db.execute(
        "UPDATE notificaciones SET is_read = true WHERE id = ? AND usuario_id = ?",
        [notificationId, req.user.id],
      );

      // Devolver objeto actualizado
      const updatedNotification = {
        ...notification,
        is_read: true,
        updated_at: new Date().toISOString(),
      };

      logger.logBusinessOperation("mark_notification_read", req.user.id, {
        notificationId,
        tipo_notificacion: notification.tipo_notificacion,
      });

      return res.json({
        ok: true,
        data: updatedNotification,
        mensaje: "Notificación marcada como leída.",
      });
    } catch (err) {
      logger.logAppError(err, req, { notificationId });
      return errorHandler(err, req, res, () => {});
    }
  },
);

// ── DELETE /api/notificaciones/todas-leidas ───────────────────────────────────
// Borrado lógico de notificaciones leídas
router.delete("/todas-leidas", auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      "UPDATE notificaciones SET deleted_at = NOW() WHERE usuario_id = ? AND is_read = true AND deleted_at IS NULL",
      [req.user.id],
    );
    return res.json({ ok: true, eliminadas: result.affectedRows });
  } catch (err) {
    console.error("Error al eliminar notificaciones leídas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── DELETE /api/notificaciones/:id ────────────────────────────────────────────
// Borrado lógico de notificación individual
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.execute(
      "UPDATE notificaciones SET deleted_at = NOW() WHERE id = ? AND usuario_id = ? AND deleted_at IS NULL",
      [req.params.id, req.user.id],
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al eliminar notificación:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getIconBgColor(tipo_notificacion) {
  const colors = {
    REVISION: "#E3F2FD",
    AVANCE: "#E8F5E9",
    SISTEMA: "#FFF3E0",
  };
  return colors[tipo_notificacion] || "#F3F4F6";
}

function getIconColor(tipo_notificacion) {
  const colors = {
    REVISION: "#2196F3",
    AVANCE: "#4CAF50",
    SISTEMA: "#FF9800",
  };
  return colors[tipo_notificacion] || "#6B7280";
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
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getActionLabel(action_screen) {
  if (!action_screen) return null;
  const labels = {
    seguimiento: "Ir a Seguimiento",
    calendario: "Ver calendario",
    reportes: "Ver reporte",
    proyectos: "Ver proyecto",
  };
  return labels[action_screen] || "Ver detalles";
}

module.exports = router;
