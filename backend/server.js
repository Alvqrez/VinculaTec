const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const citasRoutes = require("./routes/citas");
const asesorRoutes = require("./routes/asesor");
const residenteRoutes = require("./routes/residente");
const jefeRoutes = require("./routes/jefe");
const notificacionesRoutes = require("./routes/notificaciones");
const fotosRoutes = require("./routes/fotos");

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Se leen los orígenes permitidos desde .env (CORS_ORIGINS) como lista separada
// por comas. Si no está definido, se permite localhost:8081 por defecto.
// Ejemplo en .env:
//   CORS_ORIGINS=http://localhost:8081,http://192.168.1.50:8081
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:8081", "http://localhost:19006"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (apps móviles nativas, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true, // Necesario porque el frontend usa credentials: "include"
  }),
);

app.use(express.json({ limit: "10mb" })); // limit ampliado para fotos base64

// ── Archivos estáticos (uploads) ─────────────────────────────────────────────
// Agregado: Servir archivos estáticos desde la carpeta uploads
// Por qué: Los archivos subidos por los residentes se guardan en el disco del servidor
// Para qué: Permitir que el asesor pueda descargar y ver los archivos PDF
app.use("/uploads", express.static("uploads"));

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/asesor", asesorRoutes);
app.use("/api/residente", residenteRoutes);
app.use("/api/jefe", jefeRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/fotos", fotosRoutes);

// Health check
app.get("/api/health", (_, res) =>
  res.json({ ok: true, mensaje: "VinculaTec API corriendo 🚀" }),
);

// ── Inicio ───────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐  Orígenes CORS permitidos: ${allowedOrigins.join(", ")}`);
});
