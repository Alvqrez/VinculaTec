const express = require("express");
const cors    = require("cors");
require("dotenv").config();

const authRoutes           = require("./routes/auth");
const citasRoutes          = require("./routes/citas");
const asesorRoutes         = require("./routes/asesor");
const residenteRoutes      = require("./routes/residente");
const jefeRoutes           = require("./routes/jefe");
const notificacionesRoutes = require("./routes/notificaciones");
const fotosRoutes          = require("./routes/fotos");
const reportesRoutes       = require("./routes/reportes");   // ← NUEVO

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Si no está definido en .env, permite los orígenes locales de Expo
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:8081", "http://localhost:19006"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);                    // Postman / nativo
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" })); // límite ampliado para fotos base64

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use("/api/auth",           authRoutes);
app.use("/api/citas",          citasRoutes);
app.use("/api/asesor",         asesorRoutes);
app.use("/api/residente",      residenteRoutes);
app.use("/api/jefe",           jefeRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/fotos",          fotosRoutes);
app.use("/api/reportes",       reportesRoutes);                    // ← NUEVO

// Health check
app.get("/api/health", (_, res) =>
  res.json({ ok: true, mensaje: "VinculaTec API corriendo 🚀" }),
);

// ── Inicio ────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐  Orígenes CORS permitidos: ${allowedOrigins.join(", ")}`);
});
