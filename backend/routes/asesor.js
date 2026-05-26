const express = require("express");
const db = require("../db");
const { auth, requireRol } = require("../middleware");

const router = express.Router();

// ── Helpers de normalización ──────────────────────────────────────────────────
const TIPO_TO_FASE = {
  preliminar: "Preliminar",
  parcial1: "Parcial 1",
  parcial2: "Parcial 2",
  parcial3: "Parcial 3",
  final: "Final",
};

const ESTADO_TO_STATUS = {
  Aprobado: "Aceptado",
  "En Revisión": "Pendiente",
  Entregado: "Pendiente",
  Pendiente: "Pendiente",
  Rechazado: "Por corregir",
};

function normalizarFase(tipo) {
  return TIPO_TO_FASE[tipo] || tipo;
}

function normalizarStatus(estado) {
  return ESTADO_TO_STATUS[estado] || estado;
}

// SEGURIDAD FIX #3: Solo asesores pueden acceder a estas rutas
const soloAsesor = [auth, requireRol("asesor")];

// ── GET /api/asesor/dashboard ─────────────────────────────────────────────────
router.get("/dashboard", ...soloAsesor, async (req, res) => {
  try {
    const userId = req.user.id;

    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [userId],
    );
    if (!asesorRows.length)
      return res
        .status(403)
        .json({ ok: false, mensaje: "El usuario no es asesor." });

    const asesorId = asesorRows[0].id;

    const [resRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM residentes WHERE asesor_id = ? AND estado = 'activo'",
      [asesorId],
    );

    const [projRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM proyectos p
       WHERE p.asesor_id = ? AND p.estado IN ('desarrollo','revision')`,
      [asesorId],
    );

    const [repRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM reportes r
       JOIN residentes res ON r.residente_id = res.id
       WHERE res.asesor_id = ? AND r.estado IN ('Pendiente','En Revisión')`,
      [asesorId],
    );

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
        totalResidentes: resRows[0].total,
        proyectosActivos: projRows[0].total,
        reportesPendientes: repRows[0].total,
        proximasCitas: citaRows,
      },
    });
  } catch (err) {
    console.error("Error en /asesor/dashboard:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

// ── GET /api/asesor/proyectos ─────────────────────────────────────────────────
router.get("/proyectos", ...soloAsesor, async (req, res) => {
  try {
    const userId = req.user.id;

    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [userId],
    );
    if (!asesorRows.length)
      return res
        .status(403)
        .json({ ok: false, mensaje: "El usuario no es asesor." });

    const asesorId = asesorRows[0].id;

    const [projects] = await db.execute(
      `SELECT p.id, p.titulo AS title, p.descripcion AS description,
              p.estado AS phase, p.prioridad AS priority,
              e.nombre AS company, e.id AS empresa_id,
              p.progreso, p.tecnologias AS habilidades,
              p.residente_id,
              COALESCE(res.horas_completadas, 0) AS horasDocumentadas,
              COALESCE(res.horas_requeridas, 480) AS horasTotales,
              res.fecha_inicio AS fechaInicio,
              res.fecha_fin AS fechaFin,
              p.solicitud_avance
       FROM proyectos p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN residentes res ON p.residente_id = res.id
       WHERE p.asesor_id = ?
       ORDER BY p.created_at DESC`,
      [asesorId],
    );

    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        let residentes = [];
        if (project.residente_id) {
          const [mainRes] = await db.execute(
            `SELECT r.id, u.nombre, u.apellidos,
                    r.carrera, r.num_control,
                    r.horas_completadas, r.horas_requeridas, r.estado
             FROM residentes r
             JOIN usuarios u ON r.usuario_id = u.id
             WHERE r.id = ?`,
            [project.residente_id],
          );
          residentes = mainRes;
        } else if (project.empresa_id) {
          const [empRes] = await db.execute(
            `SELECT r.id, u.nombre, u.apellidos,
                    r.carrera, r.num_control,
                    r.horas_completadas, r.horas_requeridas, r.estado
             FROM residentes r
             JOIN usuarios u ON r.usuario_id = u.id
             WHERE r.asesor_id = ? AND r.empresa_id = ?`,
            [asesorId, project.empresa_id],
          );
          residentes = empRes;
        }

        let reportes = [];
        if (project.residente_id) {
          const [reps] = await db.execute(
            `SELECT r.id, r.tipo AS fase, u.nombre AS residente,
                    r.estado AS status, r.calificacion AS score,
                    r.fecha_entrega AS fecha, r.feedback,
                    r.fecha_limite, r.archivo_url AS archivo
             FROM reportes r
             JOIN residentes res ON r.residente_id = res.id
             JOIN usuarios u ON res.usuario_id = u.id
             WHERE res.id = ?
             ORDER BY FIELD(r.tipo,'preliminar','parcial1','parcial2','parcial3','final')`,
            [project.residente_id],
          );
          reportes = reps;
        }

        const [reuniones] = await db.execute(
          `SELECT c.id, c.motivo AS titulo, c.fecha_hora,
                  c.lugar, c.tipo AS tipo, c.estado
           FROM citas c
           WHERE c.participante_id = ?
             AND c.estado != 'Cancelada'
           LIMIT 10`,
          [userId],
        );

        return {
          ...project,
          phase: project.phase.toLowerCase(),
          habilidades: project.habilidades
            ? project.habilidades
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          solicitudAvance: Boolean(project.solicitud_avance),
          residentes: residentes.map((r) => ({
            id: r.id,
            nombre: `${r.nombre} ${r.apellidos}`,
            iniciales: `${r.nombre.charAt(0)}${r.apellidos.charAt(0)}`,
            rol: "Residente",
            carrera: r.carrera,
            numControl: r.num_control,
            asignado: true,
          })),
          reportes: reportes.map((rep) => {
            const faseNorm = normalizarFase(rep.fase);
            const statusNorm = normalizarStatus(rep.status);
            const fechaISO =
              rep.fecha && rep.fecha !== null
                ? new Date(rep.fecha).toISOString().split("T")[0]
                : null;
            return {
              id: rep.id,
              titulo: `Reporte ${faseNorm}`,
              residente: rep.residente || "Desconocido",
              fase: faseNorm,
              status: statusNorm,
              score: rep.score,
              fecha: fechaISO,
              feedback: rep.feedback,
              archivo: rep.archivo,
              historial: [],
              cumpleObjetivos: statusNorm === "Aceptado" ? true : null,
              cumpleDiagnostico: statusNorm === "Aceptado" ? true : null,
              cumplePlanTrabajo: statusNorm === "Aceptado" ? true : null,
              fechaRevision: null,
            };
          }),
          reuniones: reuniones.map((r) => ({
            id: r.id,
            titulo: r.titulo,
            fecha: new Date(r.fecha_hora).toISOString().split("T")[0],
            hora: new Date(r.fecha_hora).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            tipo: r.tipo,
            modalidad: "Presencial",
          })),
          residentesRequeridos: residentes.length > 0 ? residentes.length : 1,
        };
      }),
    );

    return res.json({ ok: true, proyectos: projectsWithDetails });
  } catch (err) {
    console.error("Error en /asesor/proyectos:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error al obtener proyectos." });
  }
});

// ── POST /api/asesor/proyectos/:id/solicitar-avance ───────────────────────────
router.post(
  "/proyectos/:id/solicitar-avance",
  ...soloAsesor,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const proyectoId = req.params.id;

      const [asesorRows] = await db.execute(
        "SELECT id FROM asesores WHERE usuario_id = ?",
        [userId],
      );
      if (!asesorRows.length)
        return res
          .status(403)
          .json({ ok: false, mensaje: "El usuario no es asesor." });

      const asesorId = asesorRows[0].id;

      // BUG FIX: verificar acceso por proyecto_asesores O por asesor_id directo
      // (proyectos asignados vía el panel del Jefe solo tienen asesor_id)
      const [projectRows] = await db.execute(
        `SELECT p.id, p.titulo, p.estado,
                (SELECT 1 FROM proyecto_asesores pa WHERE pa.proyecto_id = p.id AND pa.asesor_id = ?) AS en_tabla
         FROM proyectos p WHERE p.id = ? AND (p.asesor_id = ? OR EXISTS(
           SELECT 1 FROM proyecto_asesores pa2 WHERE pa2.proyecto_id = p.id AND pa2.asesor_id = ?
         ))`,
        [asesorId, proyectoId, asesorId, asesorId],
      );
      if (!projectRows.length)
        return res
          .status(404)
          .json({ ok: false, mensaje: "Proyecto no encontrado o sin acceso." });

      if (projectRows[0].estado === "concluido")
        return res
          .status(400)
          .json({ ok: false, mensaje: "El proyecto ya está concluido." });

      await db.execute(
        "UPDATE proyectos SET solicitud_avance = 1 WHERE id = ?",
        [proyectoId],
      );

      // Emitir en tiempo real: el Jefe verá la solicitud sin recargar
      const io = req.app.get("io");
      if (io) {
        io.emit("proyecto_solicitud_avance", {
          proyectoId,
          titulo: projectRows[0].titulo,
        });
      }

      return res.json({
        ok: true,
        mensaje: "Solicitud de avance enviada correctamente.",
      });
    } catch (err) {
      console.error("Error en /asesor/proyectos/:id/solicitar-avance:", err);
      return res
        .status(500)
        .json({ ok: false, mensaje: "Error al solicitar avance de fase." });
    }
  },
);

// ── PUT /api/asesor/reportes/:id/revisar ─────────────────────────────────────
// Guarda la revisión (aprobado/rechazado + feedback) del asesor en la BD
router.put("/reportes/:id/revisar", ...soloAsesor, async (req, res) => {
  const { estado, feedback, calificacion } = req.body;
  const userId = req.user.id;
  const reporteId = req.params.id;

  // Validar estado
  if (!["Aprobado", "Rechazado"].includes(estado))
    return res.status(400).json({
      ok: false,
      mensaje: "Estado inválido. Usa 'Aprobado' o 'Rechazado'.",
    });

  try {
    // Obtener asesorId del JWT
    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [userId],
    );
    if (!asesorRows.length)
      return res
        .status(403)
        .json({ ok: false, mensaje: "El usuario no es asesor." });

    const asesorId = asesorRows[0].id;

    // Verificar que el reporte pertenece a un residente de ESTE asesor
    const [reportRows] = await db.execute(
      `SELECT r.id FROM reportes r
       JOIN residentes res ON r.residente_id = res.id
       WHERE r.id = ? AND res.asesor_id = ?`,
      [reporteId, asesorId],
    );
    if (!reportRows.length)
      return res.status(404).json({
        ok: false,
        mensaje: "Reporte no encontrado o no tienes acceso a este reporte.",
      });

    // Guardar revisión en la BD
    await db.execute(
      "UPDATE reportes SET estado = ?, feedback = ?, calificacion = ? WHERE id = ?",
      [estado, feedback || null, calificacion || null, reporteId],
    );

    // Emitir evento WebSocket para que el residente reciba el feedback en tiempo real
    const io = req.app.get("io");
    if (io) {
      io.emit("reporte_revisado", {
        reporteId,
        estado,
        feedback: feedback || null,
      });
    }

    return res.json({
      ok: true,
      mensaje: `Reporte ${estado === "Aprobado" ? "aprobado" : "rechazado"} correctamente.`,
    });
  } catch (err) {
    console.error("Error en PUT /asesor/reportes/:id/revisar:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

// ── POST /api/asesor/proyectos/:id/aprobar-avance ─────────────────────────────
// Aprobar solicitud de avance de fase con auditoría completa
router.post(
  "/proyectos/:id/aprobar-avance",
  ...soloAsesor,
  async (req, res) => {
    const { comentarios = "", fase_destino } = req.body;
    const userId = req.user.id;
    const proyectoId = req.params.id;

    // Validar fase_destino
    const fasesValidas = ["desarrollo", "revision", "concluido"];
    if (fase_destino && !fasesValidas.includes(fase_destino)) {
      return res.status(400).json({
        ok: false,
        mensaje: "Fase destino inválida. Usa: desarrollo, revision, concluido",
      });
    }

    try {
      // Obtener asesorId del JWT
      const [asesorRows] = await db.execute(
        "SELECT id FROM asesores WHERE usuario_id = ?",
        [userId],
      );
      if (!asesorRows.length)
        return res
          .status(403)
          .json({ ok: false, mensaje: "El usuario no es asesor." });

      const asesorId = asesorRows[0].id;

      // Verificar que el proyecto pertenece a este asesor
      const [paRows] = await db.execute(
        "SELECT 1 FROM proyecto_asesores WHERE proyecto_id = ? AND asesor_id = ?",
        [proyectoId, asesorId],
      );
      if (!paRows.length)
        return res
          .status(404)
          .json({ ok: false, mensaje: "Proyecto no encontrado." });

      // Obtener estado actual del proyecto
      const [projectRows] = await db.execute(
        "SELECT id, fase, estado, solicitud_avance FROM proyectos WHERE id = ?",
        [proyectoId],
      );
      if (!projectRows.length)
        return res
          .status(404)
          .json({ ok: false, mensaje: "Proyecto no encontrado." });

      const proyecto = projectRows[0];

      // Validar que haya una solicitud de avance pendiente
      if (!proyecto.solicitud_avance) {
        return res.status(400).json({
          ok: false,
          mensaje:
            "No hay una solicitud de avance pendiente para este proyecto.",
        });
      }

      // Determinar siguiente fase
      const secuenciaFases = [
        "propuesto",
        "desarrollo",
        "revision",
        "concluido",
      ];
      const indiceActual = secuenciaFases.indexOf(proyecto.fase);
      const siguienteFase = fase_destino || secuenciaFases[indiceActual + 1];

      if (!siguienteFase || indiceActual === -1) {
        return res.status(400).json({
          ok: false,
          mensaje: "No se puede determinar la siguiente fase.",
        });
      }

      // Iniciar transacción para auditoría
      await db.execute("START TRANSACTION");

      try {
        // Actualizar proyecto
        await db.execute(
          "UPDATE proyectos SET fase = ?, solicitud_avance = 0, updated_at = NOW() WHERE id = ?",
          [siguienteFase, proyectoId],
        );

        // Registrar auditoría
        await db.execute(
          `INSERT INTO auditoria_proyectos 
           (proyecto_id, asesor_id, accion, fase_anterior, fase_nueva, comentarios, ip_address, user_agent)
           VALUES (?, ?, 'APROBAR_AVANCE', ?, ?, ?, ?, ?)`,
          [
            proyectoId,
            asesorId,
            proyecto.fase,
            siguienteFase,
            comentarios,
            req.ip,
            req.get("User-Agent") || "Unknown",
          ],
        );

        // Confirmar transacción
        await db.execute("COMMIT");

        // Emitir evento WebSocket
        const io = req.app.get("io");
        if (io) {
          io.to(`proyecto_${proyectoId}`).emit("avance_aprobado", {
            proyectoId,
            fase_anterior: proyecto.fase,
            fase_nueva: siguienteFase,
            comentarios,
            aprobado_por: userId,
            timestamp: new Date().toISOString(),
          });
        }

        // Devolver objeto actualizado
        const [updatedRows] = await db.execute(
          "SELECT id, titulo, fase, estado, updated_at FROM proyectos WHERE id = ?",
          [proyectoId],
        );

        return res.json({
          ok: true,
          data: updatedRows[0],
          mensaje: `Avance a fase "${siguienteFase}" aprobado correctamente.`,
          auditoria: {
            accion: "APROBAR_AVANCE",
            fase_anterior: proyecto.fase,
            fase_nueva: siguienteFase,
            comentarios,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (transError) {
        await db.execute("ROLLBACK");
        throw transError;
      }
    } catch (err) {
      console.error("Error en POST /asesor/proyectos/:id/aprobar-avance:", err);
      return res
        .status(500)
        .json({ ok: false, mensaje: "Error interno del servidor." });
    }
  },
);

// ── POST /api/asesor/desbloquear-reporte ───────────────────────────────────────
// Persistir el estado de desbloqueo manual de un reporte para un residente
router.post("/desbloquear-reporte", auth, requireRol("asesor"), async (req, res) => {
  const { residenteNombre, fase, proyectoId } = req.body;

  if (!residenteNombre || !fase || !proyectoId) {
    return res.status(400).json({
      ok: false,
      mensaje: "residenteNombre, fase y proyectoId son requeridos.",
    });
  }

  try {
    // Obtener asesor_id del usuario autenticado
    const [asesorRows] = await db.execute(
      "SELECT id FROM asesores WHERE usuario_id = ?",
      [req.user.id],
    );
    if (!asesorRows.length) {
      return res.status(403).json({ ok: false, mensaje: "El usuario no es asesor." });
    }
    const asesorId = asesorRows[0].id;

    // Obtener residente_id del nombre
    const [residenteRows] = await db.execute(
      `SELECT r.id FROM residentes r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE CONCAT(u.nombre, ' ', u.apellidos) = ? AND r.asesor_id = ?`,
      [residenteNombre, asesorId],
    );
    if (!residenteRows.length) {
      return res.status(404).json({ ok: false, mensaje: "Residente no encontrado." });
    }
    const residenteId = residenteRows[0].id;

    // Mapear fase al tipo de reporte en la base de datos
    const faseToTipo = {
      "Parcial 1": "parcial1",
      "Parcial 2": "parcial2",
      "Parcial 3": "parcial3",
      "Final": "final",
    };
    const tipo = faseToTipo[fase];
    if (!tipo) {
      return res.status(400).json({ ok: false, mensaje: "Fase no válida." });
    }

    // Verificar si el reporte ya existe
    const [existingReport] = await db.execute(
      "SELECT id FROM reportes WHERE residente_id = ? AND tipo = ?",
      [residenteId, tipo],
    );

    if (existingReport.length > 0) {
      // Si el reporte ya existe, actualizar su estado a "Pendiente" para permitir reenvío
      await db.execute(
        "UPDATE reportes SET estado = 'Pendiente' WHERE id = ?",
        [existingReport[0].id],
      );
    } else {
      // Si no existe, crear un reporte vacío con estado "Pendiente"
      const tsShort = Date.now().toString().slice(-8);
      const newId = `r_${residenteId}_${tipo}_${tsShort}`;
      await db.execute(
        `INSERT INTO reportes (id, residente_id, tipo, estado, fecha_entrega)
         VALUES (?, ?, ?, 'Pendiente', NULL)`,
        [newId, residenteId, tipo],
      );
    }

    // Emitir evento WebSocket para notificar al residente
    const io = req.app.get("io");
    if (io) {
      const [usuarioRows] = await db.execute(
        "SELECT usuario_id FROM residentes WHERE id = ?",
        [residenteId],
      );
      if (usuarioRows.length > 0) {
        io.to(`user_${usuarioRows[0].usuario_id}`).emit("reporte_desbloqueado", {
          fase,
          proyectoId,
        });
      }
    }

    return res.json({ ok: true, mensaje: "Reporte desbloqueado correctamente." });
  } catch (err) {
    console.error("Error en POST /asesor/desbloquear-reporte:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno del servidor." });
  }
});

module.exports = router;
