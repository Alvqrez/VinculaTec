const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, mensaje: "Sin token." });
  try {
    if (!process.env.JWT_SECRET)
      return res.status(500).json({ ok: false, mensaje: "JWT_SECRET no está configurado en el servidor." });
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido." });
  }
};

// Mapeo tipo BD → id frontend
const TIPO_TO_ID = {
  preliminar: "preliminar",
  parcial1: 1,
  parcial2: 2,
  parcial3: 3,
  final: "final",
};

const TIPO_TO_TITLE = {
  preliminar: "Reporte Preliminar",
  parcial1: "Reporte Parcial 1",
  parcial2: "Reporte Parcial 2",
  parcial3: "Reporte Parcial 3",
  final: "Reporte Final",
};

const TIPO_TO_SUBTITLE = {
  preliminar: "Diagnóstico inicial del proyecto",
  parcial1: "Semana 1–4 · Diagnóstico inicial",
  parcial2: "Semana 5–8 · Desarrollo",
  parcial3: "Semana 9–12 · Integración",
  final: "Semana 13–16 · Cierre",
};

const ESTADO_TO_STATUS = {
  Pendiente: "Pendiente",
  Entregado: "Pendiente",
  "En Revisión": "En Revisión",  // Corrección: Debería ser "En Revisión", no "Pendiente"
  Aprobado: "Aceptado",
  Rechazado: "Por corregir",
};

// ── GET /api/residente/reportes ───────────────────────────────────────────────
router.get("/reportes", auth, async (req, res) => {
  try {
    const [resRows] = await db.execute(
      "SELECT r.id, r.asesor_id FROM residentes r WHERE r.usuario_id = ?",
      [req.user.id]
    );
    if (!resRows.length)
      return res.status(403).json({ ok: false, mensaje: "El usuario no es residente." });

    const residenteId = resRows[0].id;
    const asesorId = resRows[0].asesor_id;

    // Obtener nombre del asesor
    let asesorNombre = "Asesor";
    if (asesorId) {
      const [asesorRows] = await db.execute(
        "SELECT u.nombre, u.apellidos FROM usuarios u JOIN asesores a ON a.usuario_id = u.id WHERE a.id = ?",
        [asesorId]
      );
      if (asesorRows.length)
        asesorNombre = `${asesorRows[0].nombre} ${asesorRows[0].apellidos}`;
    }

    const [rows] = await db.execute(
      // MODIFICADO: Agregado nombre_archivo para que el frontend pueda mostrar el nombre del archivo
      `SELECT tipo, estado, fecha_entrega, feedback, archivo_url, nombre_archivo
       FROM reportes WHERE residente_id = ? ORDER BY FIELD(tipo,'preliminar','parcial1','parcial2','parcial3','final')`,
      [residenteId]
    );

    // Construir lista completa (si no existe en BD, status Pendiente sin entregar)
    const TIPOS = ["preliminar", "parcial1", "parcial2", "parcial3", "final"];
    const reportes = TIPOS.map((tipo) => {
      const row = rows.find((r) => r.tipo === tipo);
      const fechaEntrega = row?.fecha_entrega
        ? new Date(row.fecha_entrega).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
        : null;
      // Corrección: Agregar trim() para eliminar espacios en blanco del estado
      const estadoNormalizado = row?.estado?.trim() || "";
      const status = row ? (ESTADO_TO_STATUS[estadoNormalizado] || "Pendiente") : "Pendiente";
      // Agregado: Log para depurar discrepancia de estado
      if (tipo === "preliminar") {
        console.log(`[DEBUG] Reporte preliminar: BD estado="${row?.estado}", Normalizado="${estadoNormalizado}", Frontend status="${status}"`);
      }
      return {
        id: TIPO_TO_ID[tipo],
        title: TIPO_TO_TITLE[tipo],
        subtitle: TIPO_TO_SUBTITLE[tipo],
        status: status,
        submitted: fechaEntrega,
        reviewer: asesorNombre,
        feedback: row?.feedback || null,
        archivo_url: row?.archivo_url || null,  // Agregado: URL del archivo (data URI)
        nombre_archivo: row?.nombre_archivo || null,  // Agregado: nombre del archivo
        items: [],
      };
    });

    return res.json({ ok: true, reportes });
  } catch (err) {
    console.error("Error en /residente/reportes:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── PUT /api/residente/reportes/:tipo ─────────────────────────────────────────
// Residente entrega un reporte (crea o actualiza)
// MODIFICADO: Ahora acepta y guarda el archivo (base64) y nombre_archivo
router.put("/reportes/:tipo", auth, async (req, res) => {
  const tiposValidos = ["preliminar", "parcial1", "parcial2", "parcial3", "final"];
  const { tipo } = req.params;
  if (!tiposValidos.includes(tipo))
    return res.status(400).json({ ok: false, mensaje: "Tipo de reporte inválido." });

  try {
    const [resRows] = await db.execute(
      "SELECT id FROM residentes WHERE usuario_id = ?",
      [req.user.id]
    );
    if (!resRows.length)
      return res.status(403).json({ ok: false, mensaje: "El usuario no es residente." });

    const residenteId = resRows[0].id;
    const today = new Date().toISOString().split("T")[0];

    // Obtener archivo y nombre_archivo del cuerpo de la petición (enviados desde el frontend)
    const { archivo, nombre_archivo, empresa } = req.body || {};
    
    // Agregado: Log para depurar si se recibe el archivo
    console.log(`[DEBUG] Subiendo reporte: tipo=${tipo}, archivo=${archivo ? 'recibido (' + archivo.length + ' chars)' : 'null'}, nombre_archivo=${nombre_archivo}`);
    
    // Agregado: Función para guardar archivo en disco
    // Por qué: El archivo no debe guardarse en la base de datos como base64, sino en el disco del servidor
    // Para qué: Ahorrar espacio en la base de datos y permitir descargar el archivo correctamente
    let archivoUrl = null;
    if (archivo && nombre_archivo) {
      try {
        // Crear carpeta uploads si no existe
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generar nombre único para el archivo
        const extension = path.extname(nombre_archivo);
        const nombreUnico = `${residenteId}_${tipo}_${Date.now()}${extension}`;
        const rutaArchivo = path.join(uploadsDir, nombreUnico);
        
        // Extraer datos base64 (quitar el prefijo "data:application/pdf;base64,")
        const base64Data = archivo.includes(',') ? archivo.split(',')[1] : archivo;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Guardar archivo en disco
        fs.writeFileSync(rutaArchivo, buffer);
        
        // Guardar la ruta relativa para usar en la URL
        archivoUrl = `/uploads/${nombreUnico}`;
        console.log(`[DEBUG] Archivo guardado en disco: ${rutaArchivo}`);
      } catch (error) {
        console.error(`[ERROR] Error al guardar archivo en disco:`, error);
        // Continuar sin archivo si hay error
      }
    }

    const [existing] = await db.execute(
      "SELECT id FROM reportes WHERE residente_id = ? AND tipo = ?",
      [residenteId, tipo]
    );

    if (existing.length) {
      // Actualizar reporte existente
      // Corrección: Si archivo es null (deshacer envío), cambiar estado a "Pendiente" y limpiar fecha_entrega
      // Por qué: El usuario necesita poder deshacer el envío y volver a subir el archivo
      // Para qué: Permitir que el reporte vuelva a estado "Pendiente" cuando se deshace el envío
      if (archivo === null) {
        await db.execute(
          `UPDATE reportes SET estado = 'Pendiente', fecha_entrega = NULL, archivo_url = NULL, nombre_archivo = NULL
           WHERE residente_id = ? AND tipo = ?`,
          [residenteId, tipo]
        );
      } else {
        console.log(`[DEBUG] Actualizando reporte existente: residente_id=${residenteId}, tipo=${tipo}, archivoUrl=${archivoUrl}, nombre_archivo=${nombre_archivo}`);
        await db.execute(
          `UPDATE reportes SET estado = 'En Revisión', fecha_entrega = ?, archivo_url = ?, nombre_archivo = ?
           WHERE residente_id = ? AND tipo = ?`,
          [today, archivoUrl || null, nombre_archivo || null, residenteId, tipo]
        );
        console.log(`[DEBUG] Reporte actualizado exitosamente`);
      }
    } else {
      // Crear nuevo reporte: guardar archivo, nombre_archivo y estado "En Revisión"
      const newId = `rep_${residenteId}_${tipo}_${Date.now()}`;
      await db.execute(
        `INSERT INTO reportes (id, residente_id, tipo, estado, fecha_entrega, archivo_url, nombre_archivo)
         VALUES (?,?,?,'En Revisión',?,?,?)`,
        [newId, residenteId, tipo, today, archivoUrl || null, nombre_archivo || null]
      );
    }

    // Agregado: Emitir evento WebSocket para actualizar en tiempo real
    // Por qué: El profe pidió que la aplicación sea capaz de abrirse en múltiples dispositivos simultáneamente
    // Para qué: Cuando un residente sube un reporte, los asesores conectados reciben la actualización automáticamente
    const io = req.app.get("io");
    if (io) {
      io.emit("reporte_actualizado", {
        residente_id: residenteId,
        tipo,
        estado: "En Revisión",
        archivo_url: archivoUrl,
        nombre_archivo,
      });
      console.log(`[WebSocket] Evento emitido: reporte_actualizado para residente ${residenteId}`);
    }

    return res.json({ ok: true, archivo_url: archivoUrl, nombre_archivo });
  } catch (err) {
    console.error("Error en PUT /residente/reportes/:tipo:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/residente/asesor ─────────────────────────────────────────────────
// Datos del asesor asignado al residente
router.get("/asesor", auth, async (req, res) => {
  try {
    const [resRows] = await db.execute(
      "SELECT asesor_id FROM residentes WHERE usuario_id = ?",
      [req.user.id]
    );
    if (!resRows.length)
      return res.status(403).json({ ok: false, mensaje: "El usuario no es residente." });

    const asesorId = resRows[0].asesor_id;
    if (!asesorId)
      return res.json({ ok: true, asesor: null });

    const [rows] = await db.execute(
      `SELECT u.nombre, u.apellidos, u.correo, a.departamento, a.num_empleado
       FROM asesores a JOIN usuarios u ON a.usuario_id = u.id WHERE a.id = ?`,
      [asesorId]
    );
    if (!rows.length)
      return res.json({ ok: true, asesor: null });

    const a = rows[0];
    return res.json({
      ok: true,
      asesor: {
        nombre: `${a.nombre} ${a.apellidos}`,
        iniciales: `${a.nombre.charAt(0)}${a.apellidos.charAt(0)}`,
        correo: a.correo,
        departamento: a.departamento || "",
        extension: a.num_empleado || "",
      },
    });
  } catch (err) {
    console.error("Error en /residente/asesor:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/residente/proyecto ───────────────────────────────────────────────
// Datos del proyecto asignado al residente
// Agregado: Para que el residente pueda ver en qué proyecto está asignado
// Por qué: El residente necesita saber su proyecto, empresa y asesor
// Para qué: Mostrar información del proyecto en el dashboard del residente
router.get("/proyecto", auth, async (req, res) => {
  try {
    const [resRows] = await db.execute(
      "SELECT id FROM residentes WHERE usuario_id = ?",
      [req.user.id]
    );
    if (!resRows.length)
      return res.status(403).json({ ok: false, mensaje: "El usuario no es residente." });

    const residenteId = resRows[0].id;

    const [rows] = await db.execute(
      `SELECT p.id, p.titulo, p.descripcion, p.estado, p.prioridad, p.tecnologias,
              p.progreso, p.created_at,
              e.id AS empresa_id, e.nombre AS empresa_nombre, e.estado AS empresa_estado,
              a.id AS asesor_id, CONCAT(u.nombre, ' ', u.apellidos) AS asesor_nombre,
              a.departamento AS asesor_departamento
       FROM proyectos p
       LEFT JOIN empresas e ON p.empresa_id = e.id
       LEFT JOIN asesores a ON p.asesor_id = a.id
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       WHERE p.residente_id = ?`,
      [residenteId]
    );

    if (!rows.length)
      return res.json({ ok: true, proyecto: null });

    const p = rows[0];
    return res.json({
      ok: true,
      proyecto: {
        id: p.id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        estado: p.estado,
        prioridad: p.prioridad,
        tecnologias: p.tecnologias,
        progreso: p.progreso,
        created_at: p.created_at,
        empresa: {
          id: p.empresa_id,
          nombre: p.empresa_nombre,
          estado: p.empresa_estado,
        },
        asesor: {
          id: p.asesor_id,
          nombre: p.asesor_nombre,
          departamento: p.asesor_departamento,
        },
      },
    });
  } catch (err) {
    console.error("Error en /residente/proyecto:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

// ── GET /api/residente/empresas ───────────────────────────────────────────────
// Lista de empresas disponibles para el reporte preliminar
// Agregado: Para que el residente seleccione una empresa de un listado en lugar de escribir el nombre
// Por qué: Evitar errores de escritura y garantizar que la empresa existe en el sistema
// Para qué: Mostrar un selector/dropdown con las empresas disponibles en el reporte preliminar
router.get("/empresas", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, nombre, estado FROM empresas WHERE estado != 'Inactiva' ORDER BY nombre ASC"
    );
    return res.json({ ok: true, empresas: rows });
  } catch (err) {
    console.error("Error en /residente/empresas:", err);
    return res.status(500).json({ ok: false, mensaje: "Error interno." });
  }
});

module.exports = router;
