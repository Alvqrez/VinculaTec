const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const citasRoutes = require("./routes/citas");
const asesorRoutes = require("./routes/asesor");
const residenteRoutes = require("./routes/residente");
const jefeRoutes = require("./routes/jefe");
const notificacionesRoutes = require("./routes/notificaciones");
const fotosRoutes = require("./routes/fotos");
const reportesRoutes = require("./routes/reportes"); // ← NUEVO

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Misma lógica que CORS de Express
      if (!origin) return callback(null, true);
      if (origin.includes("localhost")) return callback(null, true);
      if (origin.includes("127.0.0.1")) return callback(null, true);
      if (origin.includes("ngrok-free.dev")) return callback(null, true);
      if (origin.includes("ngrok.io")) return callback(null, true);
      callback(null, true); // Permisivo para WebSocket en desarrollo
    },
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
// Permite orígenes locales de Expo, ngrok, y cualquier origen definido en .env
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [
      "http://localhost:8081",      // Expo development
      "http://localhost:19006",     // Expo web
      "http://localhost:3000",      // React dev server
      "https://flock-gratuity-dancing.ngrok-free.dev",  // ngrok actual (legacy)
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (Postman, curl, móvil nativo)
      if (!origin) return callback(null, true);
      
      // Permitir orígenes locales
      if (origin.includes("localhost")) return callback(null, true);
      if (origin.includes("127.0.0.1")) return callback(null, true);
      
      // Permitir cualquier ngrok (para facilitar desarrollo con ngrok gratuito)
      if (origin.includes("ngrok-free.dev")) return callback(null, true);
      if (origin.includes("ngrok.io")) return callback(null, true);
      
      // Permitir orígenes explícitamente configurados
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      console.warn(`[CORS] Origen no permitido: ${origin}`);
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" })); // límite ampliado para fotos base64

// ── Archivos estáticos (uploads) ─────────────────────────────────────────────
// Agregado: Servir archivos estáticos desde la carpeta uploads
// Por qué: Los archivos subidos por los residentes se guardan en el disco del servidor
// Para qué: Permitir que el asesor pueda descargar y ver los archivos PDF
app.use("/uploads", express.static("uploads"));

// ── WebSockets ─────────────────────────────────────────────────────────────────
// Agregado: Manejar conexiones de WebSockets para actualizaciones en tiempo real
// Por qué: El profe pidió que la aplicación sea capaz de abrirse en múltiples dispositivos simultáneamente
// Para qué: Permitir que cuando un usuario actualice datos, los otros dispositivos reciban la actualización automáticamente
io.on("connection", (socket) => {
  console.log(`[WebSocket] Cliente conectado: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[WebSocket] Cliente desconectado: ${socket.id}`);
  });
});

// Hacer io disponible para las rutas
app.set("io", io);

// ── Rutas ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/asesor", asesorRoutes);
app.use("/api/residente", residenteRoutes);
app.use("/api/jefe", jefeRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/fotos", fotosRoutes);
app.use("/api/reportes", reportesRoutes); // ← NUEVO

// Health check
app.get("/api/health", (_, res) =>
  res.json({ ok: true, mensaje: "VinculaTec API corriendo 🚀" }),
);

// ── Inicio ───────────────────────────────────────────────────────────────────
// Modificado: Usar server.listen en lugar de app.listen para soportar WebSockets
// Por qué: WebSockets requieren un servidor HTTP, no solo Express
// Para qué: Permitir conexiones WebSocket para actualizaciones en tiempo real
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅  Servidor corriendo en http://0.0.0.0:${PORT}`);
  console.log(`🌐  Orígenes CORS permitidos: ${allowedOrigins.join(", ")}`);
  console.log(`🔌 WebSockets habilitados para actualizaciones en tiempo real`);
});
