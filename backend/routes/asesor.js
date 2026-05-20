const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

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

// ── Middleware: verificar JWT ─────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({
          ok: false,
          mensaje: "JWT_SECRET no está configurado en el servidor.",
        });
    }
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
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
      return res
        .status(403)
        .json({ ok: false, mensaje: "El usuario no es asesor." });

    const asesorId = asesorRows[0].id;

    // Residentes activos asignados a este asesor
    const [resRows] = await db.execute(
      "SELECT COUNT(*) AS total FROM residentes WHERE asesor_id = ? AND estado = 'activo'",
      [asesorId],
    );

    // Proyectos activos del asesor (vía tabla junction proyecto_asesores)
    const [projRows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM proyectos p
       JOIN proyecto_asesores pa ON pa.proyecto_id = p.id AND pa.asesor_id = ?
       WHERE p.estado IN ('desarrollo','revision')`,
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
// Obtiene todos los proyectos donde el asesor está en proyecto_asesores
router.get("/proyectos", authMiddleware, async (req, res) => {
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

    // Proyectos donde el asesor es principal o aparece en proyecto_asesores
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
       LEFT JOIN proyecto_asesores pa ON pa.proyecto_id = p.id AND pa.asesor_id = ?
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN residentes res ON p.residente_id = res.id
       WHERE p.asesor_id = ? OR pa.asesor_id = ?
       ORDER BY p.created_at DESC`,
      [asesorId, asesorId, asesorId],
    );

    // Para cada proyecto obtener residentes, reportes y reuniones
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        // Residentes: todos los residentes cuyo asesor es este asesor y están en este proyecto.
        // Un proyecto tiene un residente_id principal; adicionalmente todos los residentes
        // de este asesor que pertenecen a la misma empresa son co-residentes del proyecto.
        let residentes = [];
        if (project.residente_id) {
          // Residente principal del proyecto
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
          // Sin residente asignado explícito: usar los residentes del asesor en esa empresa
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

        // Reportes vinculados al residente principal del proyecto
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

        // Citas/reuniones del asesor relacionadas con el proyecto
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
  authMiddleware,
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

      // Verificar que el asesor pertenece al proyecto (vía junction table)
      const [paRows] = await db.execute(
        "SELECT 1 FROM proyecto_asesores WHERE proyecto_id = ? AND asesor_id = ?",
        [proyectoId, asesorId],
      );
      if (!paRows.length)
        return res
          .status(404)
          .json({ ok: false, mensaje: "Proyecto no encontrado." });

      const [projectRows] = await db.execute(
        "SELECT id, estado FROM proyectos WHERE id = ?",
        [proyectoId],
      );
      if (!projectRows.length)
        return res
          .status(404)
          .json({ ok: false, mensaje: "Proyecto no encontrado." });

      if (projectRows[0].estado === "concluido")
        return res
          .status(400)
          .json({ ok: false, mensaje: "El proyecto ya está concluido." });

      await db.execute(
        "UPDATE proyectos SET solicitud_avance = 1 WHERE id = ?",
        [proyectoId],
      );

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

module.exports = router;
